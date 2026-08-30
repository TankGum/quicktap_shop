// Nhận đơn từ công cụ "Thiết kế riêng" (components/DesignStudio.jsx).
//
// Đây là Cloudflare Pages Function, KHÔNG phải route của Next.js: site build ra HTML tĩnh
// (`output: 'export'`) nên không có server Next lúc chạy. Cloudflare Pages tự nhận thư mục
// `functions/` ở gốc repo và phục vụ file này tại /api/thiet-ke-rieng, cùng tên miền với
// site — nên không cần cấu hình CORS, không cần Worker riêng, không thêm bước deploy.
//
// Vì sao phải có tầng này thay vì gọi thẳng Airtable từ trình duyệt: token Airtable có quyền
// đọc/ghi TOÀN BỘ base (cả bảng sản phẩm và ảnh). Đưa nó vào JS của trang là công khai nó cho
// bất kỳ ai mở DevTools.
//
// Luồng: CHẶN SPAM -> đọc multipart -> kiểm tra -> upload ảnh mẫu lên Cloudinary -> tạo
// record Airtable kèm LINK tới ảnh. Thứ tự này là cố ý: mọi bước tốn tài nguyên (đọc body, upload
// ảnh, gọi Airtable) đều nằm SAU bước chặn spam, nên một kẻ bấm gửi liên tục chỉ tốn của
// mình đúng vài phép đọc KV.
//
// Biến môi trường + binding cần đặt trong Cloudflare Pages (Settings), KHÔNG phải chỉ trong
// .env.local — xem README mục "Nhận đơn Thiết kế riêng".

const MAX_FILE_BYTES = 10 * 1024 * 1024;
// Chặn ngay từ Content-Length, trước cả khi đọc body: ảnh mẫu là PNG cỡ vài MB, vượt xa mức
// này thì không cần đọc làm gì.
const MAX_BODY_BYTES = 12 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

// Chặn trên cho các ô chữ. Không phải để "làm sạch dữ liệu" mà để một request cố tình nhồi
// vài MB chữ không biến thành một record Airtable khổng lồ.
const MAX_TEXT = { shop: 120, phone: 40, note: 2000 };

// Hạn mức theo IP. Hai cửa sổ chồng nhau: cửa ngắn chặn kiểu bấm gửi liên tục, cửa dài chặn
// kiểu rải đều cả ngày. Quán thật đi đặt hàng thì 3 mẫu / 10 phút đã rất thoải mái.
const IP_LIMITS = [
  { windowSec: 600, max: 3 },
  { windowSec: 86400, max: 10 },
];

// Trần chung cho TOÀN BỘ endpoint. IP thì đổi được (VPN, botnet), nên cần thêm một cái van
// tổng để không ai đốt được hoá đơn Cloudinary/Airtable của mình trong một đêm.
const GLOBAL_LIMIT = { windowSec: 86400, max: 200 };

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

// Mã đơn ngắn để hai bên gọi đúng một thứ lúc nói chuyện điện thoại. Bỏ các ký tự dễ đọc
// nhầm khi đọc qua điện thoại: 0/O, 1/I.
function orderCode() {
  const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return `TK-${[...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join('')}`;
}

function cleanText(value, max) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

async function sha1Hex(text) {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ---------- Chặn spam ----------

/**
 * Đếm lượt theo cửa sổ cố định, lưu trên KV.
 *
 * Cửa sổ CỐ ĐỊNH chứ không trượt: mỗi lượt chỉ tốn 1 lần đọc + 1 lần ghi, trong khi cửa sổ
 * trượt phải giữ cả danh sách mốc thời gian. Đổi lại, ngay ranh giới hai cửa sổ có thể lọt
 * gần gấp đôi hạn mức trong chốc lát — với mức 3 đơn/10 phút thì chuyện đó vô hại.
 *
 * KV chỉ "cuối cùng cũng nhất quán", nên vài request bắn cùng lúc qua các máy chủ biên khác
 * nhau có thể cùng đọc ra một con số cũ và lọt qua. Muốn đếm chính xác tuyệt đối phải dùng
 * Durable Object; ở quy mô một form đặt hàng thì không đáng đổi lấy thêm hạ tầng.
 */
async function hitLimit(kv, key, windowSec, max) {
  const now = Math.floor(Date.now() / 1000);
  const bucket = Math.floor(now / windowSec);
  const k = `rl:${key}:${bucket}`;

  const used = parseInt(await kv.get(k), 10) || 0;
  if (used >= max) {
    return { ok: false, retryAfter: (bucket + 1) * windowSec - now };
  }
  // expirationTtl dài hơn cửa sổ một chút, để bản ghi không hết hạn ngay trước lúc cửa sổ
  // đóng và làm bộ đếm bị xoá trắng giữa chừng.
  await kv.put(k, String(used + 1), { expirationTtl: windowSec + 60 });
  return { ok: true };
}

async function checkRateLimit(kv, ip) {
  for (const { windowSec, max } of IP_LIMITS) {
    const r = await hitLimit(kv, `ip:${ip}:${windowSec}`, windowSec, max);
    if (!r.ok) return r;
  }
  return hitLimit(kv, 'all', GLOBAL_LIMIT.windowSec, GLOBAL_LIMIT.max);
}

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

// ---------- Xử lý đơn ----------

export async function onRequestPost({ request, env }) {
  const missing = [
    'AIRTABLE_TOKEN',
    'AIRTABLE_BASE_ID',
    'AIRTABLE_DESIGN_ORDERS_TABLE_ID',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    // Binding KV (tên đặt trong Cloudflare Pages -> Settings -> Functions -> KV namespace
    // bindings). CỐ TÌNH để bắt buộc: thiếu nó thì endpoint vẫn chạy nhưng không còn gì chặn
    // spam — hỏng đúng thứ đang cần bảo vệ mà nhìn từ ngoài lại tưởng mọi thứ bình thường.
    'KV_BINDING',
  ].filter((k) => !env[k]);

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
  const limit = await checkRateLimit(env.KV_BINDING, ip);
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

  const shop = cleanText(form.get('shop'), MAX_TEXT.shop);
  const phone = cleanText(form.get('phone'), MAX_TEXT.phone);
  if (!shop || !phone) {
    return json({ message: 'Thiếu tên quán hoặc số điện thoại.' }, 400);
  }

  const note = cleanText(form.get('note'), MAX_TEXT.note);
  // Số lượng do khách gõ tay nên có thể là chuỗi rỗng, số âm, hoặc chữ.
  const quantity = Math.max(1, Math.min(9999, parseInt(form.get('quantity'), 10) || 1));

  // CHỈ nhận ảnh mẫu đã dựng xong, không nhận file logo gốc: bảng đơn có đúng một cột link
  // (`Cloudinary Link`), mà tải thêm một file không có chỗ chứa thì chỉ tốn băng thông của
  // khách lẫn dung lượng Cloudinary. Cần cả logo gốc để lên bản in thì thêm cột `Logo URL`
  // vào bảng rồi mở lại phần này (và phần gửi file ở components/DesignStudio.jsx).
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

  // TÊN CỘT phải khớp TUYỆT ĐỐI với bảng Airtable: sai một tên là Airtable trả 422 và rớt
  // NGUYÊN CẢ đơn, không phải chỉ thiếu một ô. Danh sách này bám theo tên cột sẵn có trong
  // bảng (Customer Name, Phone Number, Quantity, Notes, Order Date) chứ không bắt đổi tên.
  //
  // Lưu LINK Cloudinary chứ không đính kèm file vào Airtable: ảnh chỉ nằm đúng một chỗ, không
  // ăn dung lượng đính kèm của Airtable, và link Cloudinary thì vĩnh viễn.
  //
  // KHÔNG lưu mã màu nền, tên mẫu hay loại sản phẩm: cả ba đều đã nhìn thấy trong chính ảnh
  // mẫu, thêm cột chỉ tổ phải nhìn hai chỗ mà vẫn ra một thông tin. Mã đơn cũng không lưu
  // thành cột riêng — nó nằm sẵn trong tên file trên Cloudinary (vd .../TK-8F3K-preview.png).
  const fields = {
    'Customer Name': shop,
    'Phone Number': phone,
    Quantity: quantity,
    Notes: note || null,
    // Ghi thẳng thay vì dựa vào cột "Created time" tự động của Airtable: cột đó phải tạo đúng
    // kiểu mới có, còn cách này thì tạo thiếu cột là báo lỗi ngay chứ không âm thầm mất ngày.
    'Order Date': new Date().toISOString(),
    'Cloudinary Link': designUrl,
  };

  const res = await fetch(
    `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${env.AIRTABLE_DESIGN_ORDERS_TABLE_ID}`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.AIRTABLE_TOKEN}`,
        'content-type': 'application/json',
      },
      // typecast: Airtable tự tạo option mới cho cột single-select nếu giá trị chưa có, thay
      // vì trả lỗi và làm mất nguyên một đơn.
      body: JSON.stringify({ fields, typecast: true }),
    }
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    // Ảnh đã nằm trên Cloudinary rồi — ghi cả link vào log để đơn không mất trắng nếu Airtable
    // lỗi (vd sai tên cột lúc mới cấu hình).
    console.error(
      `[thiet-ke-rieng] ${code} ghi Airtable thất bại (${res.status}): ${detail}\n` +
      `  anh=${designUrl}\n  ${shop} / ${phone} / SL ${quantity}`
    );
    return json({ message: 'Lưu đơn không thành công.' }, 502);
  }

  return json({ ok: true, code });
}

// Gọi nhầm bằng GET (mở thẳng URL trên trình duyệt) thì trả lời rõ ràng thay vì để Pages rơi
// về trang 404 tĩnh của site — lúc đi dò lỗi cấu hình sẽ đỡ mất công đoán.
export function onRequestGet() {
  return json({ message: 'Endpoint này chỉ nhận POST từ trang /thiet-ke-rieng.' }, 405);
}
