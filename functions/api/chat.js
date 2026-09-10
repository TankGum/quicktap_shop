// Trợ lý chat của site — vừa tư vấn sản phẩm, vừa tra đơn "Thiết kế riêng".
//
// Là Cloudflare Pages Function, KHÔNG phải Worker riêng: đặt ở đây thì nó dùng chung tên miền
// với site (không cần CORS), dùng lại đúng binding D1 `DB` và KV `KV_BINDING` mà
// functions/api/thiet-ke-rieng.js đang dùng, và đi chung một lần deploy. Một Worker trên
// workers.dev sẽ phải khai secret ở hai nơi, bind lại D1/KV, và bị vài DNS doanh nghiệp chặn.
//
// Luồng: CHẶN SPAM -> kiểm tra tin nhắn -> tra đơn (chỉ khi khách đưa ĐỦ mã + số điện thoại)
// -> nạp kiến thức từ /kb.json -> gọi Workers AI dạng luồng -> vừa đẩy chữ về khách vừa gom
// lại để ghi log ẩn danh. Thứ tự cố ý giống thiet-ke-rieng.js: mọi bước tốn tài nguyên (gọi
// D1, gọi model) đều nằm SAU bước chặn spam.
//
// RANH GIỚI AN NINH nằm trong code này, không nằm ở chỗ model có ngoan hay không: model không
// bao giờ sinh SQL, không bao giờ chọn được đọc đơn nào. Nó chỉ nhận được kết quả của một câu
// SELECT tham số cố định mà file này quyết định có chạy hay không.
//
// Binding + biến môi trường phải đặt trong Cloudflare Pages (Settings) — xem README mục
// "Trợ lý chat". Mở /api/chat bằng trình duyệt (GET) để biết môi trường đang thiếu gì.

// Luật số điện thoại Việt Nam chỉ có MỘT bản, ở đây dùng lại chứ không chép sang.
import { normalizePhone } from '../../lib/orderValidation.js';
import { checkRateLimit, hitLimit } from '../../lib/kvRateLimit.mjs';
import { findOrderRef } from '../../lib/chatOrderRef.mjs';
import { redact } from '../../lib/chatRedact.mjs';
import { buildSystemPrompt } from '../../lib/chatPrompt.mjs';
import { splitSseEvents, sseData, extractDelta } from '../../lib/chatStream.mjs';

const MODEL = '@cf/google/gemma-4-26b-a4b-it';

// Số token tối đa cho MỘT câu trả lời. Prompt đã bắt trả lời 2–4 câu; trần này là cái chặn
// cứng để một lượt hỏng (model lặp vô tận) không đốt hết hạn mức của cả ngày.
const MAX_TOKENS = 512;

// TẮT phần "suy luận" của model. Đây KHÔNG phải tinh chỉnh cho vui — thiếu dòng này thì
// endpoint hỏng hẳn.
//
// gemma-4 là model reasoning: nó phát `reasoning_content` (tự lẩm bẩm, bằng tiếng Anh) TRƯỚC
// rồi mới tới `content`. Với system prompt ~2.500 token của mình, phần lẩm bẩm ăn hết sạch 512
// token, `content` trả về RỖNG và `finish_reason` là "length" — khách nhìn thấy khung chat
// không hiện chữ nào.
//
// Số đo thật trên cùng một câu hỏi (đo ngày 2026-09-07, xem bảng trong README):
//
//   mặc định                 6,7 giây | 1.361 ký tự lẩm bẩm | 409 token ra | 11,55 neuron
//   enable_thinking: false   1,7 giây |     0 ký tự lẩm bẩm |  72 token ra |  2,38 neuron
//   reasoning_effort: 'low'  7,9 giây | 1.984 ký tự lẩm bẩm | 512 token ra | 14,36 neuron -> content RỖNG
//
// Nhanh gấp 4, rẻ gấp 4,9, mà câu trả lời còn nhỉnh hơn. Lưu ý `reasoning_effort` — tham số CÓ
// trong tài liệu Cloudflare — lại làm suy luận DÀI THÊM và giết chết câu trả lời; đừng dùng.
//
// `chat_template_kwargs` là tham số riêng của họ model gemma. Đổi sang model khác thì phải đo
// lại: model không hiểu khoá này sẽ bỏ qua (vô hại), nhưng nếu nó cũng là model reasoning thì
// lỗi "không hiện chữ" quay lại y nguyên.
const NO_THINKING = { chat_template_kwargs: { enable_thinking: false } };

// Chặn từ Content-Length trước cả khi đọc body. Đây là JSON vài dòng chữ, không phải ảnh.
const MAX_BODY_BYTES = 32 * 1024;

const MAX_MESSAGES = 16;       // số phần tử client được gửi lên
const MAX_CONTENT_CHARS = 500;  // mỗi tin
const MAX_TOTAL_CHARS = 6000;   // cả hội thoại
// Server tự cắt bớt lịch sử trước khi gửi cho model: chi phí mỗi lượt tỉ lệ với độ dài hội
// thoại, không cắt thì một khách ngồi chat lâu sẽ mỗi lúc một đắt.
const KEEP_MESSAGES = 12;

// Hạn mức. Chặt hơn hẳn form đặt hàng vì mỗi lượt ở đây tốn neuron (tiền), không chỉ tốn ghi.
const IP_LIMITS = [
  { windowSec: 300, max: 8 },
  { windowSec: 86400, max: 40 },
];

// Trần chung — cái van cuối, vì IP thì đổi được (VPN, botnet).
//
// Con số 300 lấy từ SỐ ĐO THẬT, không phải ước lượng: bốn lượt chat đầy đủ chạy qua endpoint
// này (đo 2026-09-07, sau khi tắt suy luận — xem NO_THINKING ở trên) tốn trung bình
// 27 neuron/lượt. Hạn mức miễn phí của Workers AI là 10.000 neuron/ngày:
//
//     10.000 / 27 ≈ 370 lượt/ngày
//
// Đặt 300 để còn biên cho những lượt có lịch sử hội thoại dài — chi phí gần như nằm hết ở
// PROMPT (~2.500 token system prompt so với ~100 token trả lời), nên hội thoại càng dài thì
// mỗi lượt càng đắt. Vượt trần không gãy gì, chỉ là bắt đầu tính tiền.
//
// Cột `neurons` trong chat_logs ghi chi phí thật từng lượt (`npm run d1:chat`) — chạy thật vài
// ngày rồi chỉnh lại theo số của chính mình.
const GLOBAL_LIMIT = { windowSec: 86400, max: 300 };

// Hạn mức RIÊNG cho lượt có tra đơn, chặn kiểu dò mã. Chỉ đếm khi khách thật sự đưa đủ mã +
// số điện thoại — nếu đếm cả lượt chat thường thì khách tư vấn bình thường sẽ hết lượt tra.
const LOOKUP_LIMIT = { windowSec: 3600, max: 5 };

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

// ---------- Kiến thức sản phẩm ----------

// Nhớ trong phạm vi isolate: Workers giữ biến module giữa các request chạy trên cùng một
// isolate, nên thực tế mỗi isolate chỉ tải /kb.json đúng một lần. Không cần lo bản cũ dính
// lâu: deploy mới sinh isolate mới, mà /kb.json cũng chỉ đổi khi deploy.
let kbCache = null;

async function loadKnowledgeBase(env, request) {
  if (kbCache) return kbCache;

  // env.ASSETS chứ KHÔNG phải fetch(). Cả hai đều lấy đúng file tĩnh của chính deployment này,
  // nhưng fetch() đi một vòng ra edge — và bản preview có Cloudflare Access đứng chặn ở edge.
  // Subrequest do Function tự gọi không mang cookie Access, nên nó nhận 302 về trang đăng nhập
  // thay vì JSON: khung chat trả 503 trong khi binding không thiếu gì cả, nhìn log chỉ thấy
  // "/kb.json trả 302". env.ASSETS đọc thẳng tài sản của deployment, không rời khỏi Worker, nên
  // không có gì chặn được và cũng không tốn một lượt đi ra ngoài.
  const res = await env.ASSETS.fetch(new URL('/kb.json', request.url));
  if (!res.ok) throw new Error(`/kb.json trả ${res.status}`);

  kbCache = await res.json();
  return kbCache;
}

// ---------- Kiểm tra tin nhắn ----------

/**
 * Kiểm tra mảng messages client gửi lên.
 *
 * CHỈ nhận role 'user' và 'assistant'. Vai 'system' bị chặn thẳng tay: system prompt luôn do
 * server dựng (lib/chatPrompt.mjs), nhận từ client là để bất kỳ ai mở DevTools cũng ghi đè
 * được toàn bộ luật — kể cả luật cấm bịa giá.
 */
function validateMessages(raw) {
  const reject = (message) => ({ ok: false, message });

  if (!Array.isArray(raw) || raw.length === 0) return reject('Thiếu nội dung tin nhắn.');
  if (raw.length > MAX_MESSAGES) return reject('Cuộc trò chuyện dài quá, bạn mở lại khung chat giúp mình nhé.');

  const messages = [];
  let total = 0;

  for (const item of raw) {
    const role = item?.role;
    if (role !== 'user' && role !== 'assistant') return reject('Dữ liệu gửi lên không hợp lệ.');

    const content = String(item?.content ?? '').replace(/\s+/g, ' ').trim();
    if (!content) return reject('Dữ liệu gửi lên không hợp lệ.');
    if (content.length > MAX_CONTENT_CHARS) {
      return reject(`Tin nhắn dài quá ${MAX_CONTENT_CHARS} ký tự, bạn rút gọn giúp mình.`);
    }

    total += content.length;
    messages.push({ role, content });
  }

  if (total > MAX_TOTAL_CHARS) {
    return reject('Cuộc trò chuyện dài quá, bạn mở lại khung chat giúp mình nhé.');
  }
  // Lượt cuối phải là của khách, nếu không thì chẳng có gì để trả lời.
  if (messages[messages.length - 1].role !== 'user') return reject('Dữ liệu gửi lên không hợp lệ.');

  return { ok: true, messages: messages.slice(-KEEP_MESSAGES) };
}

// Mã phiên do client sinh, chỉ dùng để nối các dòng log của cùng một cuộc trò chuyện. Lọc sạch
// ký tự lạ vì nó đi thẳng vào D1 và sẽ được đọc lại bằng mắt lúc xem log.
function cleanSessionId(raw) {
  const cleaned = String(raw ?? '').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 64);
  return cleaned || 'khong-ro';
}

// ---------- Tra đơn ----------

/**
 * Tra một đơn khi khách đưa ĐỦ mã đơn + số điện thoại.
 *
 * Vì sao bắt buộc cả hai: mã đơn chỉ 4 ký tự từ bảng 32 (~1 triệu tổ hợp) — đủ để đọc qua
 * điện thoại, KHÔNG đủ làm mật khẩu. Chỉ cần mã là ai đó viết script quét sẽ moi ra danh sách
 * khách hàng.
 *
 * Câu SELECT cố tình KHÔNG lấy customer_name và phone dù D1 có sẵn: khách vốn đã biết hai thứ
 * đó, còn model thì không nên có cơ hội đọc chúng ra.
 */
async function lookupOrder(db, ref) {
  const row = await db
    .prepare(
      `SELECT code, quantity, order_date, cloudinary_link
         FROM design_orders
        WHERE code = ? AND phone = ?`
    )
    .bind(ref.code, ref.phone)
    .first();

  if (row) {
    return {
      kind: 'design',
      code: row.code,
      quantity: row.quantity,
      orderDate: row.order_date,
      designUrl: row.cloudinary_link,
    };
  }

  // Hai luồng đặt hàng ghi vào hai bảng khác nhau nhưng dùng CHUNG một họ mã (lib/orderCode.mjs)
  // và khách thì chỉ biết đúng một mã. Quên tra bảng thứ hai là khách đặt qua giỏ hàng hỏi "đơn
  // tôi sao rồi" sẽ nhận "không tìm thấy đơn" — dữ liệu có đủ mà đường dẫn tới model bị đứt.
  const shop = await db
    .prepare(
      `SELECT code, order_date, payment_method, status, subtotal, discount, shipping_fee, total
         FROM shop_orders
        WHERE code = ? AND phone = ?`
    )
    .bind(ref.code, ref.phone)
    .first();

  // Không khớp ở CẢ HAI bảng thì chỉ báo "không tìm thấy", KHÔNG bao giờ tách ra "mã đúng, số
  // sai" — chính câu đó xác nhận mã có tồn tại, tức là biến việc quét mã thành có ích. Xem
  // orderSection trong lib/chatPrompt.mjs.
  if (!shop) return { notFound: true };

  // Câu SELECT ở đây cũng KHÔNG lấy customer_name, phone và địa chỉ dù D1 có sẵn: cùng lý do
  // với design_orders — khách vốn đã biết, còn model thì không nên có cơ hội đọc chúng ra.
  const items = await db
    .prepare(
      `SELECT variant_name, unit_price, quantity
         FROM shop_order_items
        WHERE order_code = ?`
    )
    .bind(ref.code)
    .all();

  return {
    kind: 'shop',
    code: shop.code,
    orderDate: shop.order_date,
    paymentMethod: shop.payment_method,
    status: shop.status,
    subtotal: shop.subtotal,
    discount: shop.discount,
    shippingFee: shop.shipping_fee,
    total: shop.total,
    lines: (items?.results || []).map((r) => ({
      name: r.variant_name,
      unitPrice: r.unit_price,
      quantity: r.quantity,
    })),
  };
}

// ---------- Chống bot ----------

// Chưa đặt TURNSTILE_SECRET_KEY thì bỏ qua — giống hệt thiet-ke-rieng.js, bật sau mà không
// phải sửa code. Lớp BỔ SUNG cho hạn mức: Turnstile chặn máy, hạn mức chặn cả người thật.
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

// ---------- Ghi log ----------

/**
 * Ghi một lượt hỏi–đáp vào chat_logs, ĐÃ ẩn danh hoá (xem lib/chatRedact.mjs).
 *
 * KHÔNG bao giờ ném lỗi ra ngoài: tới bước này khách đã đọc xong câu trả lời rồi, hỏng phần
 * ghi log mà kéo theo hỏng câu trả lời là ngược đời. Cùng nguyên tắc notifyTelegram đang dùng
 * ở thiet-ke-rieng.js.
 */
async function logTurn(env, { sessionId, question, answer, neurons }) {
  const now = new Date().toISOString();
  const insert = `INSERT INTO chat_logs (session_id, role, content, neurons, created_at)
                  VALUES (?, ?, ?, ?, ?)`;

  try {
    await env.DB.batch([
      env.DB.prepare(insert).bind(sessionId, 'user', redact(question), null, now),
      env.DB.prepare(insert).bind(sessionId, 'assistant', redact(answer), neurons, now),
    ]);
  } catch (err) {
    console.error(`[chat] ghi chat_logs thất bại: ${err.message}`);
  }
}

// ---------- Luồng trả lời ----------

/**
 * Đọc luồng SSE của Workers AI, phát lại về client bằng khung riêng, rồi ghi log.
 *
 * Phải đi qua đây chứ không đẩy thẳng luồng gốc về trình duyệt, vì ba lý do — xem đầu file
 * lib/chatStream.mjs (lọc reasoning_content, gộp hai định dạng khung của Workers AI, và gom
 * câu trả lời để ghi log).
 *
 * Khung phát về client cố ý tối giản, chỉ ba dạng:
 *   {"t": "..."}      một mẩu chữ
 *   {"done": true}    hết câu
 *   {"error": "..."}  đứt giữa chừng
 */
function relayAndLog({ aiStream, env, waitUntil, sessionId, question }) {
  const { readable, writable } = new TransformStream();

  const pump = (async () => {
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const reader = aiStream.getReader();

    let buffer = '';
    let answer = '';
    let neurons = null;

    const send = async (payload) => {
      try {
        await writer.write(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      } catch {
        // Khách đóng tab giữa chừng là chuyện thường, không phải lỗi đáng ghi.
      }
    };

    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const { events, rest } = splitSseEvents(buffer);
        buffer = rest; // mảnh dở dang, để dành nối với gói mạng sau

        for (const event of events) {
          const data = sseData(event);
          if (!data || data === '[DONE]') continue;

          let frame;
          try {
            frame = JSON.parse(data);
          } catch {
            continue; // khung lạ thì bỏ qua, không làm đứt cả câu trả lời
          }

          const delta = extractDelta(frame);
          if (delta.neurons !== null) neurons = delta.neurons;
          if (delta.text) {
            answer += delta.text;
            await send({ t: delta.text });
          }
        }
      }
      await send({ done: true });
    } catch (err) {
      console.error(`[chat] luồng trả lời đứt: ${err.message}`);
      await send({ error: 'Đường truyền bị gián đoạn, bạn thử hỏi lại giúp mình.' });
    } finally {
      try {
        await writer.close();
      } catch {
        /* đã đóng rồi */
      }
    }

    await logTurn(env, { sessionId, question, answer, neurons });
  })();

  // waitUntil giữ cho Function sống tới lúc bơm xong và ghi log xong, dù Response đã trả về
  // từ lâu. Bỏ lửng promise thì Workers cắt ngang giữa chừng.
  if (waitUntil) waitUntil(pump);

  return readable;
}

// ---------- Vào/ra ----------

// Ba thứ này đều là BINDING trong Cloudflare Pages (Settings -> Functions), không phải biến
// môi trường:
//   AI          -> Workers AI
//   DB          -> D1 `quicktap-orders` (bảng design_orders + chat_logs, xem d1/schema.sql)
//   KV_BINDING  -> KV namespace dùng đếm hạn mức
// KV để bắt buộc vì thiếu nó thì endpoint vẫn chạy nhưng không còn gì chặn spam — hỏng đúng
// thứ đang cần bảo vệ mà nhìn từ ngoài lại tưởng bình thường. DB bắt buộc vì tra đơn là một
// nửa lý do khung chat này tồn tại.
const REQUIRED = ['AI', 'DB', 'KV_BINDING'];
const OPTIONAL = ['TURNSTILE_SECRET_KEY'];

const missingConfig = (env) => REQUIRED.filter((k) => !env[k]);

export async function onRequestPost({ request, env, waitUntil }) {
  const missing = missingConfig(env);
  if (missing.length) {
    // Không nói tên binding nào thiếu cho khách — họ không sửa được. Chi tiết chỉ vào log.
    console.error(`[chat] Thiếu cấu hình: ${missing.join(', ')}`);
    return json({ message: 'Trợ lý đang tạm nghỉ. Bạn gọi hotline giúp mình nhé.' }, 503);
  }

  if (Number(request.headers.get('content-length') || 0) > MAX_BODY_BYTES) {
    return json({ message: 'Dữ liệu gửi lên quá lớn.' }, 413);
  }

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const limit = await checkRateLimit(env.KV_BINDING, 'chat', ip, IP_LIMITS, GLOBAL_LIMIT);
  if (!limit.ok) {
    const minutes = Math.max(1, Math.ceil(limit.retryAfter / 60));
    return json(
      { message: `Bạn vừa hỏi khá nhiều rồi. Thử lại sau khoảng ${minutes} phút, hoặc gọi cho chúng tôi để được tư vấn ngay.` },
      429,
      { 'retry-after': String(limit.retryAfter) }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Dữ liệu gửi lên không đọc được.' }, 400);
  }

  if (!(await turnstileOk(env, body?.turnstileToken, ip))) {
    return json({ message: 'Không xác minh được yêu cầu. Bạn thử tải lại trang giúp mình nhé.' }, 403);
  }

  const check = validateMessages(body?.messages);
  if (!check.ok) return json({ message: check.message }, 400);

  const messages = check.messages;
  const question = messages[messages.length - 1].content;
  const sessionId = cleanSessionId(body?.sessionId);

  // Tra đơn — chỉ chạy khi câu hỏi có ĐỦ mã đơn lẫn số điện thoại.
  let order = null;
  const ref = findOrderRef(question, normalizePhone);
  if (ref) {
    const lookup = await hitLimit(
      env.KV_BINDING,
      `chat:lookup:${ip}`,
      LOOKUP_LIMIT.windowSec,
      LOOKUP_LIMIT.max
    );
    if (!lookup.ok) {
      return json(
        { message: 'Bạn đã tra đơn khá nhiều lần. Bạn gọi hotline để mình tra giúp nhanh hơn nhé.' },
        429,
        { 'retry-after': String(lookup.retryAfter) }
      );
    }

    try {
      order = await lookupOrder(env.DB, ref);
    } catch (err) {
      // D1 lỗi thì vẫn trả lời tiếp phần tư vấn, chỉ mất phần tra đơn — hỏng một nửa còn hơn
      // trả về lỗi trắng cho một câu hỏi mà model vốn trả lời được phần còn lại.
      console.error(`[chat] tra đơn thất bại: ${err.message}`);
      order = { notFound: true };
    }
  }

  let kb;
  try {
    kb = await loadKnowledgeBase(env, request);
  } catch (err) {
    // Không có kiến thức thì thà im lặng còn hơn để model tự bịa giá cho khách.
    console.error(`[chat] không nạp được /kb.json: ${err.message}`);
    return json({ message: 'Trợ lý đang tạm nghỉ. Bạn gọi hotline giúp mình nhé.' }, 503);
  }

  let aiStream;
  try {
    aiStream = await env.AI.run(MODEL, {
      messages: [{ role: 'system', content: buildSystemPrompt(kb, order) }, ...messages],
      stream: true,
      max_tokens: MAX_TOKENS,
      // Thấp có chủ ý. Đây là trợ lý đọc lại dữ kiện trong /kb.json, không phải cây bút quảng
      // cáo — nhiệt độ mặc định làm nó tô thêm tính từ không có trong KB.
      temperature: 0.3,
      ...NO_THINKING,
    });
  } catch (err) {
    console.error(`[chat] gọi model thất bại: ${err.message}`);
    return json({ message: 'Trợ lý đang bận. Bạn thử lại sau ít phút giúp mình nhé.' }, 502);
  }

  return new Response(relayAndLog({ aiStream, env, waitUntil, sessionId, question }), {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      // Luồng phải tới từng mẩu một; để proxy nào đó gom lại thì hiệu ứng gõ dần biến mất và
      // khách ngồi nhìn màn hình trống cho tới lúc có nguyên câu.
      'cache-control': 'no-cache, no-transform',
      'x-accel-buffering': 'no',
    },
  });
}

/**
 * Mở /api/chat bằng trình duyệt để TỰ KIỂM TRA cấu hình của môi trường đang chạy.
 * Chỉ trả TÊN binding còn thiếu, không bao giờ trả giá trị — giống thiet-ke-rieng.js.
 */
export function onRequestGet({ env }) {
  const missing = missingConfig(env);
  const off = OPTIONAL.filter((k) => !env[k]);

  return json(
    {
      message: missing.length
        ? 'Chưa chạy được: môi trường này còn thiếu binding.'
        : 'Cấu hình đủ. Endpoint chỉ nhận POST từ khung chat.',
      ready: missing.length === 0,
      missing,
      off,
      model: MODEL,
      hint: missing.length
        ? 'Đặt binding trong Cloudflare Pages > Settings > Functions (Workers AI `AI`, D1 `DB`, KV `KV_BINDING`) cho ĐÚNG môi trường đang mở, rồi DEPLOY LẠI.'
        : undefined,
    },
    missing.length ? 503 : 405
  );
}
