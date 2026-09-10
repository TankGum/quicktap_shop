// Nhận đơn từ GIỎ HÀNG (/gio-hang).
//
// Cùng khuôn với functions/api/thiet-ke-rieng.js — đọc chú thích đầu file đó để hiểu vì sao
// đây là Pages Function chứ không phải route Next.
//
// Luồng: CHẶN SPAM -> đọc JSON -> nạp danh mục -> DỰNG LẠI GIÁ Ở SERVER -> kiểm tra thông tin
// -> ghi 2 bảng D1 trong một batch -> báo Telegram.
//
// Điểm quan trọng nhất của cả file: client chỉ được gửi lên { href, qty } và MÃ tỉnh/phường.
// Mọi con số tiền và mọi cái TÊN đều do server tự tra lại. Tin con số client gửi thì một cú
// curl đặt được đơn 1đ; tin cái tên client gửi thì đơn trong D1 ghi được địa chỉ do người khác
// soạn sẵn.

import { normalizePhone } from '../../lib/orderValidation.js';
import { checkRateLimit } from '../../lib/kvRateLimit.mjs';
import { orderCode } from '../../lib/orderCode.mjs';
import { siteConfig } from '../../lib/siteConfig.js';
import { catalogFromKb, priceCart } from '../../lib/cartPricing.mjs';
import { resolveAddress, validateCheckout } from '../../lib/checkoutValidation.mjs';
import { buildVietQrPayload } from '../../lib/vietQr.mjs';

// Body là JSON thuần (không có ảnh), nên chặn ở mức rất thấp — vượt qua đây gần như chắc chắn
// là ai đó đang thử bơm dữ liệu chứ không phải khách đặt hàng.
const MAX_BODY_BYTES = 64 * 1024;
const MAX_LINES = 20;

// Đặt hàng thì thao tác nhiều hơn gửi mẫu thiết kế (khách hay sửa giỏ rồi đặt lại), nhưng vẫn
// phải có trần. Quán thật đặt 5 đơn trong 10 phút là đã rất bất thường.
const IP_LIMITS = [
  { windowSec: 600, max: 5 },
  { windowSec: 86400, max: 20 },
];
const GLOBAL_LIMIT = { windowSec: 86400, max: 300 };

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

// ---------- Nạp danh mục ----------
//
// Cùng cơ chế với loadKnowledgeBase trong functions/api/chat.js: biến ở phạm vi module sống
// theo isolate nên mỗi isolate chỉ tải một lần, và deploy mới sinh isolate mới nên không lo
// dính bản cũ. Hai file này đều là tài sản tĩnh cùng tên miền, không cần khoá gì.
let kbCache = null;
let diaGioiCache = null;

async function loadStatic(env, request, path) {
  // env.ASSETS chứ KHÔNG phải fetch() — lý do đầy đủ ghi ở loadKnowledgeBase trong
  // functions/api/chat.js. Ngắn gọn: fetch() đi ra edge, bản preview có Cloudflare Access chặn
  // ở đó, subrequest không mang cookie nên nhận 302 và endpoint này trả 503 y hệt lúc thiếu
  // binding DB — cùng một câu báo lỗi cho hai nguyên nhân khác nhau, rất mất thời gian để lần.
  const res = await env.ASSETS.fetch(new URL(path, request.url));
  if (!res.ok) throw new Error(`${path} trả ${res.status}`);
  return res.json();
}

async function loadCatalogs(env, request) {
  if (!kbCache) kbCache = await loadStatic(env, request, '/kb.json');
  if (!diaGioiCache) diaGioiCache = await loadStatic(env, request, '/diachi.json');
  return { kb: kbCache, diaGioi: diaGioiCache };
}

// ---------- Báo Telegram ----------

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const vnd = (n) => `${Number(n).toLocaleString('vi-VN')}đ`;

async function notifyTelegram(env, order) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    console.warn(`[dat-hang] ${order.code}: chưa cấu hình Telegram, bỏ qua thông báo.`);
    return;
  }

  const when = new Date(order.orderDate).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const items = order.lines
    .map((l) => `• ${esc(l.name)} × ${l.qty} — ${vnd(l.lineTotal)}`)
    .join('\n');

  const lines = [
    `<b>ĐƠN MỚI ${esc(order.code)}</b>`,
    '',
    items,
    '',
    `Tạm tính: ${vnd(order.subtotal)}`,
    order.discount > 0 ? `Giảm ${Math.round(order.discountRate * 100)}%: -${vnd(order.discount)}` : null,
    `Phí giao: ${order.shipping === 0 ? 'miễn phí' : vnd(order.shipping)}`,
    `<b>Tổng: ${vnd(order.total)}</b>`,
    '',
    `Thanh toán: <b>${order.paymentMethod === 'cod' ? 'COD' : 'CHUYỂN KHOẢN — chờ tiền về'}</b>`,
    `Người nhận: ${esc(order.name)} — ${esc(order.phone)}`,
    `Địa chỉ: ${esc(order.addressLine)}, ${esc(order.wardName)}, ${esc(order.provinceName)}`,
    order.note ? `Ghi chú: ${esc(order.note)}` : null,
    `Lúc ${when}`,
  ].filter((l) => l !== null);

  try {
    const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        parse_mode: 'HTML',
        text: lines.join('\n'),
      }),
    });
    if (!res.ok) {
      console.error(`[dat-hang] ${order.code}: Telegram trả ${res.status}: ${await res.text()}`);
    }
  } catch (err) {
    console.error(`[dat-hang] ${order.code}: gọi Telegram thất bại: ${err.message}`);
  }
}

// ---------- Xử lý ----------

export async function onRequestPost({ request, env, waitUntil }) {
  if (!env.DB) {
    console.error('[dat-hang] Thiếu binding DB.');
    return json({ message: 'Hệ thống đặt hàng đang tạm gián đoạn.' }, 503);
  }

  if (Number(request.headers.get('content-length') || 0) > MAX_BODY_BYTES) {
    return json({ message: 'Dữ liệu gửi lên quá lớn.' }, 413);
  }

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const limit = await checkRateLimit(env.KV_BINDING, 'dat-hang', ip, IP_LIMITS, GLOBAL_LIMIT);
  if (!limit.ok) {
    const minutes = Math.max(1, Math.ceil(limit.retryAfter / 60));
    return json(
      { message: `Bạn vừa đặt khá nhiều đơn rồi. Thử lại sau khoảng ${minutes} phút, hoặc gọi cho chúng tôi để đặt trực tiếp.` },
      429,
      { 'retry-after': String(limit.retryAfter) }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Dữ liệu gửi lên không hợp lệ.' }, 400);
  }

  const items = Array.isArray(body?.items) ? body.items.slice(0, MAX_LINES) : [];
  if (items.length === 0) return json({ message: 'Giỏ hàng đang trống.' }, 400);

  let kb, diaGioi;
  try {
    ({ kb, diaGioi } = await loadCatalogs(env, request));
  } catch (err) {
    console.error(`[dat-hang] không nạp được danh mục: ${err.message}`);
    return json({ message: 'Hệ thống đặt hàng đang tạm gián đoạn.' }, 503);
  }

  const address = resolveAddress(diaGioi, body?.provinceCode, body?.wardCode);
  const transferEnabled = Boolean(siteConfig.bank?.bin && siteConfig.bank?.accountNo);

  const check = validateCheckout(body, { normalizePhone, address, transferEnabled });
  if (!check.ok) return json({ message: 'Thông tin chưa hợp lệ.', errors: check.errors }, 400);
  const info = check.value;

  // Đây là chỗ tiền được quyết định. Mọi con số bên dưới đều sinh ra từ kb.json + siteConfig,
  // không có một giá trị nào đi lên từ trình duyệt.
  const priced = priceCart({
    items,
    catalog: catalogFromKb(kb),
    provinceCode: info.provinceCode,
    config: {
      quantityTiers: siteConfig.quantityTiers,
      freeProvinceCode: siteConfig.shippingFreeProvinceCode,
      flatFee: siteConfig.shippingFlatFee,
    },
  });

  if (priced.lines.length === 0) {
    // Cả giỏ không còn dòng nào đặt được — thường là mẫu đã bị gỡ hoặc hết hàng kể từ lúc
    // khách bỏ vào giỏ (giỏ nằm ở localStorage nên sống lâu hơn một lần build).
    return json(
      { message: 'Các mẫu trong giỏ hiện không đặt được, bạn xem lại giúp mình.', errors: priced.errors },
      409
    );
  }
  if (priced.errors.length > 0) {
    // Còn dòng đặt được nhưng không phải tất cả. KHÔNG âm thầm bỏ bớt rồi vẫn ghi đơn: khách
    // sẽ trả tiền cho một giỏ khác với giỏ họ nhìn thấy.
    return json(
      { message: 'Một vài mẫu trong giỏ vừa thay đổi, bạn xem lại giúp mình.', errors: priced.errors },
      409
    );
  }

  const code = orderCode();
  const orderDate = new Date().toISOString();
  // COD thì việc còn lại là gọi xác nhận. Chuyển khoản thì còn phải chờ tiền về đã.
  const status = info.paymentMethod === 'cod' ? 'pending_confirmation' : 'pending_payment';

  try {
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO shop_orders
           (code, customer_name, phone, province_code, province_name, ward_code, ward_name,
            address_line, payment_method, subtotal, discount_rate, discount, shipping_fee,
            total, status, notes, order_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        code, info.name, info.phone, info.provinceCode, info.provinceName, info.wardCode,
        info.wardName, info.addressLine, info.paymentMethod, priced.subtotal, priced.discountRate,
        priced.discount, priced.shipping, priced.total, status, info.note || null, orderDate
      ),
      ...priced.lines.map((l) =>
        env.DB.prepare(
          `INSERT INTO shop_order_items (order_code, variant_href, variant_name, unit_price, quantity)
           VALUES (?, ?, ?, ?, ?)`
        ).bind(code, l.href, l.name, l.unitPrice, l.qty)
      ),
    ]);
  } catch (err) {
    // batch của D1 là all-or-nothing, nên tới đây là KHÔNG có gì được ghi — không sợ đơn cụt
    // đầu mất dòng hàng. Ghi đủ thông tin vào log để đơn không mất trắng nếu D1 lỗi (vd chưa
    // chạy d1/schema.sql nên chưa có bảng).
    console.error(
      `[dat-hang] ${code} ghi D1 thất bại: ${err.message}\n` +
      `  ${info.name} / ${info.phone} / ${vnd(priced.total)} / ${info.paymentMethod}`
    );
    return json({ message: 'Lưu đơn không thành công.' }, 502);
  }

  // Mã QR dựng Ở SERVER, từ con số server vừa tính. Để client tự dựng thì số tiền trong QR là
  // số client tự nghĩ ra — mà đó lại đúng là con số khách bấm chuyển đi.
  let payment = { method: info.paymentMethod };
  if (info.paymentMethod === 'transfer') {
    try {
      payment = {
        method: 'transfer',
        amount: priced.total,
        qrPayload: buildVietQrPayload({
          bankBin: siteConfig.bank.bin,
          accountNo: siteConfig.bank.accountNo,
          amount: priced.total,
          addInfo: code,
        }),
        bank: {
          name: siteConfig.bank.bankName,
          accountNo: siteConfig.bank.accountNo,
          accountName: siteConfig.bank.accountName,
        },
      };
    } catch (err) {
      // Đơn ĐÃ ghi vào D1 rồi — không được trả lỗi làm khách tưởng đặt hỏng. Trả về phần chữ,
      // khách vẫn chuyển khoản tay được, và log lại để sửa cấu hình.
      console.error(`[dat-hang] ${code}: dựng mã QR thất bại: ${err.message}`);
      payment = {
        method: 'transfer',
        amount: priced.total,
        qrPayload: null,
        bank: {
          name: siteConfig.bank.bankName,
          accountNo: siteConfig.bank.accountNo,
          accountName: siteConfig.bank.accountName,
        },
      };
    }
  }

  const notify = notifyTelegram(env, { code, orderDate, ...info, ...priced });
  if (waitUntil) waitUntil(notify); else await notify;

  return json({
    ok: true,
    code,
    subtotal: priced.subtotal,
    discountRate: priced.discountRate,
    discount: priced.discount,
    shipping: priced.shipping,
    total: priced.total,
    payment,
  });
}

/**
 * Mở thẳng /api/dat-hang trên trình duyệt để TỰ KIỂM TRA cấu hình của môi trường đang chạy.
 *
 * Cùng khuôn với onRequestGet của thiet-ke-rieng.js, và cùng nguyên tắc: chỉ trả về TÊN thứ
 * còn thiếu, KHÔNG bao giờ trả về giá trị.
 *
 * Có endpoint này vì phần chuyển khoản hỏng theo kiểu IM LẶNG: chưa điền siteConfig.bank thì
 * trang thanh toán chỉ đơn giản là không hiện lựa chọn chuyển khoản, nhìn từ ngoài không có
 * dấu hiệu gì bất thường — rất dễ tưởng là lỗi giao diện.
 */
export function onRequestGet({ env }) {
  const missing = [!env.DB && 'DB (binding D1)', !env.KV_BINDING && 'KV_BINDING'].filter(Boolean);

  const bankFields = ['bin', 'accountNo', 'accountName', 'bankName'].filter(
    (k) => !siteConfig.bank?.[k]
  );

  return json({
    message: missing.length
      ? 'Thiếu binding bắt buộc — đặt hàng đang trả 503.'
      : 'Cấu hình bắt buộc đã đủ, nhận đơn được.',
    missing,
    thanhToan: bankFields.length
      ? {
          trangThai: 'CHỈ COD. Chuyển khoản đang ẩn khỏi trang thanh toán.',
          thieu: bankFields.map((k) => `siteConfig.bank.${k}`),
          suaODau: 'lib/siteConfig.js — điền xong phải BUILD LẠI và deploy thì mới có hiệu lực.',
        }
      : { trangThai: 'COD + chuyển khoản.' },
    // Ảnh biên lai là tính năng phụ: thiếu R2 thì đơn vẫn đặt được, chỉ bước gửi ảnh trả 503.
    bienLai: env.RECEIPTS ? 'R2 đã gắn.' : 'THIẾU binding RECEIPTS — bước gửi ảnh chuyển khoản sẽ trả 503.',
    telegram: env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID ? 'bật' : 'tắt (đơn về nhưng điện thoại im lặng)',
  });
}
