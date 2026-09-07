// Nhận đơn từ công cụ "Thiết kế riêng" (components/DesignStudio.jsx).
//
// Đây là Cloudflare Pages Function, KHÔNG phải route của Next.js: site build ra HTML tĩnh
// (`output: 'export'`) nên không có server Next lúc chạy. Cloudflare Pages tự nhận thư mục
// `functions/` ở gốc repo và phục vụ file này tại /api/thiet-ke-rieng, cùng tên miền với
// site — nên không cần cấu hình CORS, không cần Worker riêng, không thêm bước deploy.
//
// Vì sao phải có tầng này thay vì ghi thẳng từ trình duyệt: đơn đi vào D1 và ảnh đi lên
// Cloudinary, cả hai đều cần khoá bí mật. Đưa khoá vào JS của trang là công khai nó cho bất
// kỳ ai mở DevTools.
//
// Đơn từng được lưu ở Airtable; nay lưu ở D1 (bảng `design_orders`, xem d1/schema.sql) — cùng
// nhà với Pages nên không còn token có quyền đọc/ghi TOÀN BỘ base Airtable nằm trong môi
// trường chạy, và không còn phụ thuộc một dịch vụ ngoài lúc khách bấm gửi. Airtable vẫn giữ
// nguyên vai trò cũ ở chỗ khác: nguồn dữ liệu sản phẩm/ảnh đọc LÚC BUILD (lib/airtable.js).
//
// Luồng: CHẶN SPAM -> đọc multipart -> kiểm tra -> upload ảnh mẫu lên Cloudinary -> ghi 1
// dòng vào D1 kèm LINK tới ảnh -> báo Telegram. Thứ tự này là cố ý: mọi bước tốn tài nguyên
// (đọc body, upload ảnh, ghi D1) đều nằm SAU bước chặn spam, nên một kẻ bấm gửi liên tục chỉ
// tốn của mình đúng vài phép đọc KV.
//
// Biến môi trường + binding cần đặt trong Cloudflare Pages (Settings), KHÔNG phải chỉ trong
// .env.local — xem README mục "Nhận đơn Thiết kế riêng".

// Luật kiểm tra tên quán / số điện thoại / số lượng / ghi chú dùng CHUNG với client — xem
// lib/orderValidation.js. Ở đây mới là chốt chặn thật: phần kiểm tra trong trình duyệt ai
// cũng sửa được, một cú curl là bỏ qua sạch.
import { validateOrder } from '../../lib/orderValidation.js';
// Bộ đếm hạn mức trên KV — dùng chung với functions/api/chat.js, xem lib/kvRateLimit.mjs.
import { checkRateLimit } from '../../lib/kvRateLimit.mjs';

const MAX_FILE_BYTES = 10 * 1024 * 1024;
// Chặn ngay từ Content-Length, trước cả khi đọc body: ảnh mẫu là PNG cỡ vài MB, vượt xa mức
// này thì không cần đọc làm gì.
const MAX_BODY_BYTES = 12 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

// Hạn mức theo IP. Hai cửa sổ chồng nhau: cửa ngắn chặn kiểu bấm gửi liên tục, cửa dài chặn
// kiểu rải đều cả ngày. Quán thật đi đặt hàng thì 3 mẫu / 10 phút đã rất thoải mái.
const IP_LIMITS = [
  { windowSec: 600, max: 3 },
  { windowSec: 86400, max: 10 },
];

// Trần chung cho TOÀN BỘ endpoint. IP thì đổi được (VPN, botnet), nên cần thêm một cái van
// tổng để không ai đốt được hoá đơn Cloudinary (hay bơm đầy D1) của mình trong một đêm.
const GLOBAL_LIMIT = { windowSec: 86400, max: 200 };

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

// Mã đơn ngắn để hai bên gọi đúng một thứ lúc nói chuyện điện thoại. Bỏ các ký tự dễ đọc
// nhầm khi đọc qua điện thoại: 0/O, 1/I. Mã này vừa là tên file trên Cloudinary, vừa là cột
// `code` (UNIQUE) trong D1 — khách đọc mã qua điện thoại là tra ra đúng đơn.
function orderCode() {
  const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return `TK-${[...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join('')}`;
}

async function sha1Hex(text) {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ---------- Chặn spam ----------
// Hai hàm đếm (hitLimit/checkRateLimit) trước đây nằm ngay ở đây, nay ở lib/kvRateLimit.mjs
// để khung chat dùng chung — hai bản sao của một luật chặn spam thì sớm muộn lệch nhau, mà
// lệch ở đây nghĩa là một endpoint âm thầm mất lớp bảo vệ trong khi nhìn từ ngoài vẫn ổn.
//
// Khoá KV nay có thêm tiền tố phạm vi ('rl:thiet-ke-rieng:ip:...') để hai endpoint không
// đếm chung một bộ. Lần deploy đầu sau thay đổi này, các bộ đếm đang chạy coi như về 0 —
// vô hại, vì chúng vốn chỉ sống trong một cửa sổ và sai số nghiêng về phía cho qua.

// Chống bot. Chưa cấu hình secret thì bỏ qua — để tính năng chạy được ngay, bật Turnstile sau
// mà không phải sửa code. Đây là lớp BỔ SUNG cho hạn mức ở trên chứ không thay thế: Turnstile
// chặn máy, hạn mức chặn cả người thật cố tình nghịch.
async function turnstileOk(env, token, ip) {
  if (!env.TURNSTILE_SECRET_KEY) return true;
  if (!token) return false;

  const body = new FormData();
  body.append('secret', env.TURNSTILE_SECRET_KEY);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
  });
  const data = await res.json().catch(() => ({}));
  return data.success === true;
}

// ---------- Lưu ảnh ----------

/**
 * Upload một file lên Cloudinary bằng chữ ký (signed upload).
 * Dùng endpoint /auto/ để nhận cả SVG lẫn ảnh raster mà không phải tự đoán resource_type.
 */
async function uploadToCloudinary(file, { env, folder, publicId }) {
  const timestamp = Math.floor(Date.now() / 1000);

  // Cloudinary ký trên các tham số đã SẮP XẾP theo tên, nối bằng '&', rồi nối api_secret vào
  // cuối. Sai thứ tự là chữ ký sai.
  const params = { folder, public_id: publicId, timestamp: String(timestamp) };
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  const signature = await sha1Hex(toSign + env.CLOUDINARY_API_SECRET);

  const body = new FormData();
  body.append('file', file, file.name || publicId);
  body.append('api_key', env.CLOUDINARY_API_KEY);
  body.append('timestamp', String(timestamp));
  body.append('folder', folder);
  body.append('public_id', publicId);
  body.append('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/auto/upload`, {
    method: 'POST',
    body,
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.secure_url) {
    throw new Error(`Cloudinary từ chối file ${publicId}: ${data?.error?.message || res.status}`);
  }
  return data.secure_url;
}

// ---------- Báo Telegram ----------

// Telegram parse_mode HTML chỉ hiểu vài thẻ; mọi thứ khách gõ (tên quán, ghi chú) phải được
// thoát trước, không phải để "an toàn" mà vì một dấu `<` lạc trong ghi chú đủ làm Telegram
// từ chối NGUYÊN tin nhắn với lỗi "can't parse entities".
const escapeHtml = (text) =>
  String(text).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

/**
 * Bắn thông báo đơn mới vào Telegram.
 *
 * KHÔNG bao giờ ném lỗi ra ngoài: tới bước này đơn đã nằm trong D1 rồi, mà báo trượt thì làm
 * khách thấy "gửi thất bại" và gửi lại là sai hoàn toàn — hỏng cái phụ không được kéo theo
 * cái chính. Báo trượt chỉ ghi log; đơn vẫn tra được trong D1.
 *
 * Chưa đặt TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID thì bỏ qua (giống Turnstile) — endpoint vẫn
 * nhận đơn bình thường, bật thông báo sau mà không phải sửa code.
 */
async function notifyTelegram(env, order) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    console.warn(`[thiet-ke-rieng] ${order.code}: chưa cấu hình Telegram, bỏ qua thông báo.`);
    return;
  }

  // Giờ Việt Nam, không phải UTC: tin nhắn này để đọc bằng mắt lúc 9h sáng, không phải để máy
  // đọc (cột order_date trong D1 mới là bản ISO/UTC cho máy).
  const when = new Date(order.orderDate).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour12: false,
  });

  const text = [
    `🆕 <b>Đơn thiết kế riêng</b> — <code>${escapeHtml(order.code)}</code>`,
    '',
    `🏪 <b>${escapeHtml(order.shop)}</b>`,
    `📞 ${escapeHtml(order.phone)}`,
    `🔢 Số lượng: <b>${order.quantity}</b>`,
    order.note ? `📝 ${escapeHtml(order.note)}` : null,
    `🕒 ${escapeHtml(when)}`,
    '',
    // Link để trần ở dòng cuối, cố ý: Telegram tự dựng ảnh xem trước, nên mở thông báo là
    // thấy luôn mẫu khách chốt mà không phải bấm đi đâu.
    order.designUrl,
  ]
    .filter((line) => line !== null)
    .join('\n');

  try {
    const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'HTML',
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error(`[thiet-ke-rieng] ${order.code}: Telegram trả ${res.status}: ${detail}`);
    }
  } catch (err) {
    console.error(`[thiet-ke-rieng] ${order.code}: gọi Telegram thất bại: ${err.message}`);
  }
}

// ---------- Xử lý đơn ----------

// Mọi thứ Function cần để chạy. Hai cái đầu là BINDING (Cloudflare Pages -> Settings ->
// Functions), không phải biến môi trường:
//   DB          -> D1 database `quicktap-orders` (bảng design_orders, xem d1/schema.sql)
//   KV_BINDING  -> KV namespace dùng để đếm hạn mức chặn spam
// KV cố tình để bắt buộc: thiếu nó thì endpoint vẫn chạy nhưng không còn gì chặn spam — hỏng
// đúng thứ đang cần bảo vệ mà nhìn từ ngoài lại tưởng mọi thứ bình thường.
const REQUIRED = [
  'DB',
  'KV_BINDING',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

// Có thì bật, không có thì thôi — thiếu mấy khoá này endpoint vẫn nhận đơn bình thường. Liệt
// kê ở đây chỉ để trang tự-kiểm-tra (GET) nói cho biết tính năng nào đang tắt.
const OPTIONAL = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID', 'TURNSTILE_SECRET_KEY'];

const missingConfig = (env) => REQUIRED.filter((k) => !env[k]);

export async function onRequestPost({ request, env, waitUntil }) {
  const missing = missingConfig(env);

  if (missing.length) {
    // Không nói tên biến nào thiếu cho khách — họ không sửa được, mà lộ cấu hình ra ngoài thì
    // vô ích. Chi tiết chỉ ghi vào log của Pages.
    console.error(`[thiet-ke-rieng] Thiếu cấu hình: ${missing.join(', ')}`);
    return json({ message: 'Hệ thống nhận mẫu đang tạm gián đoạn.' }, 503);
  }

  // --- Hai chốt chặn rẻ tiền, làm trước khi đụng tới body ---
  if (Number(request.headers.get('content-length') || 0) > MAX_BODY_BYTES) {
    return json({ message: 'Dữ liệu gửi lên quá lớn.' }, 413);
  }

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const limit = await checkRateLimit(env.KV_BINDING, 'thiet-ke-rieng', ip, IP_LIMITS, GLOBAL_LIMIT);
  if (!limit.ok) {
    const minutes = Math.max(1, Math.ceil(limit.retryAfter / 60));
    return json(
      { message: `Bạn vừa gửi khá nhiều mẫu rồi. Thử lại sau khoảng ${minutes} phút, hoặc gọi cho chúng tôi để đặt trực tiếp.` },
      429,
      { 'retry-after': String(limit.retryAfter) }
    );
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ message: 'Dữ liệu gửi lên không đọc được.' }, 400);
  }

  if (!(await turnstileOk(env, form.get('cf-turnstile-response'), ip))) {
    return json({ message: 'Không xác minh được yêu cầu. Bạn thử tải lại trang giúp mình nhé.' }, 403);
  }

  const check = validateOrder({
    shop: form.get('shop'),
    phone: form.get('phone'),
    quantity: form.get('quantity'),
    note: form.get('note'),
  });
  if (!check.ok) {
    // `message` là lỗi đầu tiên để hiện ngay cho khách; `errors` gửi kèm đủ cả để form gắn lỗi
    // đúng từng ô — client tự kiểm tra trước rồi, tới được đây nghĩa là request không đi qua
    // form của mình (hoặc luật hai bên đã lệch), nên cứ nói rõ.
    const [message] = Object.values(check.errors);
    return json({ message, errors: check.errors }, 400);
  }

  // Dùng bản đã chuẩn hoá, KHÔNG dùng lại dữ liệu thô: số điện thoại về một dạng duy nhất
  // (0912345678) để trong D1 cùng một quán không nằm dưới hai kiểu viết khác nhau.
  const { shop, phone, quantity, note } = check.value;

  // CHỈ nhận ảnh mẫu đã dựng xong, không nhận file logo gốc: bảng đơn có đúng một cột link
  // (`cloudinary_link`), mà tải thêm một file không có chỗ chứa thì chỉ tốn băng thông của
  // khách lẫn dung lượng Cloudinary. Cần cả logo gốc để lên bản in thì thêm cột `logo_url`
  // vào d1/schema.sql rồi mở lại phần này (và phần gửi file ở components/DesignStudio.jsx).
  const preview = form.get('preview');
  if (!preview || typeof preview === 'string') {
    return json({ message: 'Thiếu ảnh mẫu.' }, 400);
  }
  if (!ACCEPTED_TYPES.includes(preview.type)) {
    return json({ message: 'Ảnh mẫu có định dạng không nhận được.' }, 400);
  }
  if (preview.size > MAX_FILE_BYTES) {
    return json({ message: 'Ảnh mẫu vượt quá 10MB.' }, 413);
  }

  const code = orderCode();

  let designUrl;
  try {
    designUrl = await uploadToCloudinary(preview, {
      env,
      folder: 'quicktapreview/don-thiet-ke',
      publicId: `${code}-mau`,
    });
  } catch (err) {
    console.error(`[thiet-ke-rieng] ${code} upload thất bại:`, err.message);
    return json({ message: 'Tải ảnh lên không thành công.' }, 502);
  }

  // Lưu LINK Cloudinary chứ không nhét ảnh vào D1: ảnh chỉ nằm đúng một chỗ, không bơm phồng
  // database, và link Cloudinary thì vĩnh viễn.
  //
  // KHÔNG lưu mã màu nền, tên mẫu hay loại sản phẩm: cả ba đều đã nhìn thấy trong chính ảnh
  // mẫu, thêm cột chỉ tổ phải nhìn hai chỗ mà vẫn ra một thông tin.
  //
  // Ghi thẳng order_date thay vì để SQLite tự điền DEFAULT CURRENT_TIMESTAMP: cách đó cho ra
  // chuỗi 'YYYY-MM-DD HH:MM:SS' không có múi giờ, còn ISO 8601 kèm 'Z' thì new Date() ở bất
  // kỳ đâu cũng đọc đúng — kể cả đoạn đổi sang giờ Việt Nam trong tin nhắn Telegram bên dưới.
  const orderDate = new Date().toISOString();

  try {
    await env.DB.prepare(
      `INSERT INTO design_orders
         (code, customer_name, phone, quantity, notes, cloudinary_link, order_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(code, shop, phone, quantity, note || null, designUrl, orderDate)
      .run();
  } catch (err) {
    // Ảnh đã nằm trên Cloudinary rồi — ghi cả link vào log để đơn không mất trắng nếu D1 lỗi
    // (vd chưa chạy d1/schema.sql nên chưa có bảng).
    console.error(
      `[thiet-ke-rieng] ${code} ghi D1 thất bại: ${err.message}\n` +
      `  anh=${designUrl}\n  ${shop} / ${phone} / SL ${quantity}`
    );
    return json({ message: 'Lưu đơn không thành công.' }, 502);
  }

  // waitUntil: trả kết quả cho khách NGAY, Telegram chạy nốt ở nền. Khách không phải đợi thêm
  // một vòng gọi mạng cho việc chẳng liên quan gì tới họ, mà thông báo vẫn được gửi (khác hẳn
  // gọi rồi bỏ lửng promise — Workers sẽ cắt ngang khi request kết thúc).
  const notify = notifyTelegram(env, { code, shop, phone, quantity, note, designUrl, orderDate });
  if (waitUntil) waitUntil(notify); else await notify;

  return json({ ok: true, code });
}

/**
 * Mở thẳng URL này trên trình duyệt để TỰ KIỂM TRA cấu hình của môi trường đang chạy.
 *
 * Chỉ trả về TÊN các khoá còn thiếu, KHÔNG bao giờ trả về giá trị. Tên khoá vốn đã nằm công
 * khai trong README của repo nên không lộ thêm gì; đổi lại, lúc dò lỗi trên production bạn
 * thấy ngay thiếu cái gì thay vì phải lục log của Pages.
 *
 * Lưu ý hay vấp: đổi biến môi trường hay thêm binding trong Pages CHỈ có hiệu lực với các bản
 * deploy MỚI. Bản đang chạy vẫn giữ cấu hình lúc nó được tạo — sửa xong phải deploy lại.
 */
export function onRequestGet({ env }) {
  const missing = missingConfig(env);
  // `off` là các tính năng tuỳ chọn đang tắt (thông báo Telegram, Turnstile) — không phải lỗi,
  // nhưng thiếu nó thì đơn về mà điện thoại im lặng, mà đó lại đúng là kiểu hỏng không ai
  // nhận ra cho tới lúc mất một đơn.
  const off = OPTIONAL.filter((k) => !env[k]);
  return json(
    {
      message: missing.length
        ? 'Chưa chạy được: môi trường này còn thiếu cấu hình.'
        : 'Cấu hình đủ. Endpoint chỉ nhận POST từ trang /thiet-ke-rieng.',
      ready: missing.length === 0,
      missing,
      off,
      hint: missing.length
        ? 'Đặt trong Cloudflare Pages > Settings (biến môi trường + binding D1 `DB` và KV `KV_BINDING`) cho ĐÚNG môi trường đang mở, rồi DEPLOY LẠI.'
        : undefined,
    },
    missing.length ? 503 : 405
  );
}
