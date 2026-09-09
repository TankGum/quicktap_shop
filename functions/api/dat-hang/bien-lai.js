// Nhận ảnh chụp màn hình chuyển khoản cho một đơn đã có (/api/dat-hang/bien-lai).
//
// Vì sao là bước RIÊNG, sau khi đơn đã được ghi: khách cần có mã đơn TRƯỚC khi chuyển (nội
// dung chuyển khoản chính là mã đơn). Nếu chỉ ghi đơn khi đã có ảnh thì khách đóng tab giữa
// chừng là tiền đã chuyển mà đơn không tồn tại ở đâu cả.
//
// Ảnh lưu trên R2 chứ KHÔNG lên Cloudinary như ảnh thiết kế: link Cloudinary trong
// design_orders là URL công khai ai có link cũng mở được — chấp nhận được với ảnh mẫu in, nhưng
// ảnh sao kê có tên chủ tài khoản, số tài khoản, đôi khi cả số dư. R2 không sinh URL công khai
// nào, muốn xem phải qua dashboard hoặc một Function có kiểm quyền.

import { normalizePhone } from '../../../lib/orderValidation.js';
import { checkRateLimit } from '../../../lib/kvRateLimit.mjs';
import { ORDER_CODE_RE } from '../../../lib/orderCode.mjs';

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_BODY_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const IP_LIMITS = [
  { windowSec: 600, max: 6 },
  { windowSec: 86400, max: 30 },
];
const GLOBAL_LIMIT = { windowSec: 86400, max: 300 };

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };

async function notifyTelegram(env, { code, file, total }) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;
  try {
    const form = new FormData();
    form.append('chat_id', env.TELEGRAM_CHAT_ID);
    form.append('caption', `Biên lai cho đơn ${code} — cần đối chiếu ${Number(total).toLocaleString('vi-VN')}đ`);
    form.append('photo', file, `${code}.${EXT[file.type] || 'jpg'}`);
    const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) console.error(`[bien-lai] ${code}: Telegram trả ${res.status}: ${await res.text()}`);
  } catch (err) {
    console.error(`[bien-lai] ${code}: gọi Telegram thất bại: ${err.message}`);
  }
}

export async function onRequestPost({ request, env, waitUntil }) {
  if (!env.DB || !env.RECEIPTS) {
    console.error(`[bien-lai] Thiếu binding: ${[!env.DB && 'DB', !env.RECEIPTS && 'RECEIPTS'].filter(Boolean).join(', ')}`);
    return json({ message: 'Hệ thống nhận biên lai đang tạm gián đoạn.' }, 503);
  }

  if (Number(request.headers.get('content-length') || 0) > MAX_BODY_BYTES) {
    return json({ message: 'Ảnh quá lớn, bạn gửi ảnh nhỏ hơn giúp mình.' }, 413);
  }

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const limit = await checkRateLimit(env.KV_BINDING, 'bien-lai', ip, IP_LIMITS, GLOBAL_LIMIT);
  if (!limit.ok) {
    return json({ message: 'Bạn vừa gửi khá nhiều ảnh rồi, thử lại sau ít phút giúp mình.' }, 429, {
      'retry-after': String(limit.retryAfter),
    });
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ message: 'Dữ liệu gửi lên không hợp lệ.' }, 400);
  }

  const code = String(form.get('code') || '').trim().toUpperCase();
  const phone = normalizePhone(form.get('phone'));
  const file = form.get('file');

  if (!ORDER_CODE_RE.test(code) || !phone) {
    return json({ message: 'Bạn kiểm tra lại mã đơn và số điện thoại giúp mình.' }, 400);
  }
  if (!file || typeof file === 'string') {
    return json({ message: 'Bạn chọn ảnh chụp màn hình chuyển khoản giúp mình.' }, 400);
  }
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return json({ message: 'Chỉ nhận ảnh PNG, JPG hoặc WEBP.' }, 415);
  }
  if (file.size > MAX_FILE_BYTES) {
    return json({ message: 'Ảnh quá lớn, bạn gửi ảnh nhỏ hơn giúp mình.' }, 413);
  }

  // Cần ĐỦ mã đơn + số điện thoại khớp nhau mới ghi được — cùng mô hình bảo vệ mà khung chat
  // dùng để tra đơn (lib/chatOrderRef.mjs). Chỉ cần mã thôi thì ai đoán trúng mã là đính được
  // ảnh vào đơn của người khác.
  let order;
  try {
    order = await env.DB.prepare(
      `SELECT code, total, status, receipt_key FROM shop_orders WHERE code = ? AND phone = ?`
    ).bind(code, phone).first();
  } catch (err) {
    console.error(`[bien-lai] ${code} đọc D1 thất bại: ${err.message}`);
    return json({ message: 'Hệ thống nhận biên lai đang tạm gián đoạn.' }, 503);
  }

  // Cố ý mơ hồ, không nói "mã đúng nhưng số sai": chính câu đó xác nhận mã có tồn tại, tức là
  // biến việc dò mã thành có ích. Cùng lý do đã ghi ở orderSection trong lib/chatPrompt.mjs.
  if (!order) {
    return json({ message: 'Không tìm thấy đơn khớp với mã và số điện thoại này.' }, 404);
  }

  const key = `bien-lai/${code}-${Date.now()}.${EXT[file.type]}`;
  try {
    await env.RECEIPTS.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
      // Ghi kèm mã đơn vào metadata: mở R2 ra là biết object này thuộc đơn nào mà không phải
      // tra ngược sang D1.
      customMetadata: { orderCode: code },
    });
  } catch (err) {
    console.error(`[bien-lai] ${code} ghi R2 thất bại: ${err.message}`);
    return json({ message: 'Tải ảnh lên không thành công, bạn thử lại giúp mình.' }, 502);
  }

  try {
    // Chỉ đẩy trạng thái khi đơn còn đang chờ tiền. Đơn đã xác nhận hay đã huỷ thì giữ nguyên
    // trạng thái — khách gửi thêm ảnh không được phép kéo đơn ngược về bước trước.
    await env.DB.prepare(
      `UPDATE shop_orders
          SET receipt_key = ?,
              status = CASE WHEN status = 'pending_payment' THEN 'pending_confirmation' ELSE status END
        WHERE code = ?`
    ).bind(key, code).run();
  } catch (err) {
    // Ảnh đã nằm trên R2 — ghi khoá vào log để không mất dấu nếu D1 lỗi.
    console.error(`[bien-lai] ${code} cập nhật D1 thất bại: ${err.message}\n  key=${key}`);
    return json({ message: 'Lưu biên lai không thành công.' }, 502);
  }

  const notify = notifyTelegram(env, { code, file, total: order.total });
  if (waitUntil) waitUntil(notify); else await notify;

  return json({ ok: true });
}
