// Test cho phần logic thuần của khung chat.
//
// Chạy: npm test  (= node --test test/)
//
// Đây là những test ĐẦU TIÊN của repo, và cố ý chỉ phủ đúng bốn module ở lib/chat*.mjs —
// những chỗ mà một ký tự sai trong regex sẽ gây hậu quả im lặng: rò số điện thoại khách vào
// bảng log, hoặc cho phép tra đơn khi lẽ ra không được. Phần còn lại (gọi model, D1, KV) cần
// môi trường Workers thật nên kiểm bằng `npm run preview`, không giả lập ở đây.
//
// Không cần cài thêm gì: node --test có sẵn từ Node 18. Bốn module kia để đuôi .mjs chính là
// để chạy được thế này — repo không đặt "type": "module" nên node thuần đọc file .js có
// `export` sẽ báo "Unexpected token 'export'".

import test from 'node:test';
import assert from 'node:assert/strict';

import { redact, redactPhones } from '../lib/chatRedact.mjs';
import { findOrderCode, findPhoneCandidates, findOrderRef } from '../lib/chatOrderRef.mjs';
import { splitSseEvents, sseData, extractDelta } from '../lib/chatStream.mjs';
import { buildSystemPrompt } from '../lib/chatPrompt.mjs';

// ---------- lib/chatRedact.mjs ----------

test('redactPhones: bắt mọi kiểu khách hay gõ', () => {
  for (const raw of ['0388102842', '0388 102 842', '+84 388 102 842', '(028) 3822 1234', '0388.102.842', '0388-102-842']) {
    assert.equal(redactPhones(`gọi ${raw} nhé`), 'gọi [SĐT] nhé', `hụt: ${raw}`);
  }
});

test('redactPhones: không đụng vào số ngắn', () => {
  assert.equal(redactPhones('đặt 100 cái, giá 199.000 VND'), 'đặt 100 cái, giá 199.000 VND');
  assert.equal(redactPhones('năm 2026'), 'năm 2026');
});

test('redact: mã đơn và email', () => {
  assert.equal(redact('đơn TK-8F3K của tôi'), 'đơn [MÃ ĐƠN] của tôi');
  assert.equal(redact('đơn tk-8f3k'), 'đơn [MÃ ĐƠN]');
  assert.equal(redact('mail cho abc@quan.vn'), 'mail cho [EMAIL]');
});

test('redact: email đi trước, không bị bộ lọc điện thoại xé đôi', () => {
  // Phần trước @ có 10 chữ số — nếu bộ lọc điện thoại chạy trước thì ra '[SĐT]@gmail.com',
  // vẫn lộ ra là có email mà lại khó đọc.
  assert.equal(redact('mail 0388102842@gmail.com nhé'), 'mail [EMAIL] nhé');
});

test('redact: một câu có đủ ba thứ', () => {
  assert.equal(
    redact('Đơn TK-8F3K, số 0388 102 842, mail a@b.vn'),
    'Đơn [MÃ ĐƠN], số [SĐT], mail [EMAIL]'
  );
});

test('redact: chịu được đầu vào rỗng/null', () => {
  assert.equal(redact(null), '');
  assert.equal(redact(undefined), '');
  assert.equal(redact(''), '');
});

// ---------- lib/chatOrderRef.mjs ----------

test('findOrderCode: nhận chữ thường và khoảng trắng quanh gạch', () => {
  assert.equal(findOrderCode('đơn TK-8F3K'), 'TK-8F3K');
  assert.equal(findOrderCode('đơn tk-8f3k'), 'TK-8F3K');
  assert.equal(findOrderCode('đơn TK - 8F3K'), 'TK-8F3K');
});

test('findOrderCode: từ chối ký tự ngoài bảng mã', () => {
  // Bảng mã đã bỏ 0/O/1/I cho khỏi đọc nhầm qua điện thoại — xem orderCode() trong
  // functions/api/thiet-ke-rieng.js.
  assert.equal(findOrderCode('đơn TK-0O1I'), null);
  assert.equal(findOrderCode('đơn TK-8F3'), null);
  assert.equal(findOrderCode('không có mã'), null);
});

test('findPhoneCandidates: trả về theo thứ tự xuất hiện', () => {
  assert.deepEqual(findPhoneCandidates('gọi 0388102842 hoặc 0912345678'), ['0388102842', '0912345678']);
  assert.deepEqual(findPhoneCandidates('không có số nào'), []);
});

// Bản rút gọn của normalizePhone (lib/orderValidation.js) — file đó là .js nên node thuần
// không import được. Truyền vào dạng tham số chính là để chỗ này test được mà không phải chép
// luật số điện thoại sang lib/chatOrderRef.mjs.
const fakeNormalize = (raw) => {
  const d = String(raw).replace(/\D/g, '').replace(/^84/, '0');
  return /^0[35789]\d{8}$/.test(d) ? d : null;
};

test('findOrderRef: cần ĐỦ cả mã lẫn số điện thoại', () => {
  assert.equal(findOrderRef('đơn TK-8F3K đâu rồi', fakeNormalize), null, 'thiếu số mà vẫn cho tra');
  assert.equal(findOrderRef('số tôi là 0388102842', fakeNormalize), null, 'thiếu mã mà vẫn cho tra');
  assert.deepEqual(findOrderRef('đơn TK-8F3K, số 0388102842', fakeNormalize), {
    code: 'TK-8F3K',
    phone: '0388102842',
  });
});

test('findOrderRef: bỏ qua ứng viên không hợp lệ, lấy số thật', () => {
  // '123456789' đủ dài để lọt regex khoanh vùng nhưng không phải số Việt Nam.
  assert.deepEqual(findOrderRef('TK-8F3K mã số 123456789 sđt 0388102842', fakeNormalize), {
    code: 'TK-8F3K',
    phone: '0388102842',
  });
});

// ---------- lib/chatStream.mjs ----------

test('splitSseEvents: giữ lại mảnh dở dang', () => {
  const { events, rest } = splitSseEvents('data: {"a":1}\n\ndata: {"b":2}\n\ndata: {"c"');
  assert.deepEqual(events, ['data: {"a":1}', 'data: {"b":2}']);
  assert.equal(rest, 'data: {"c"');
});

test('sseData: bóc phần data, bỏ dòng khác', () => {
  assert.equal(sseData('data: {"t":"xin"}'), '{"t":"xin"}');
  assert.equal(sseData('event: ping'), null);
  assert.equal(sseData('data: [DONE]'), '[DONE]');
});

test('extractDelta: nhận cả hai định dạng khung của Workers AI', () => {
  assert.equal(extractDelta({ choices: [{ delta: { content: 'xin' } }] }).text, 'xin');
  assert.equal(extractDelta({ choices: [{ message: { content: 'chào' } }] }).text, 'chào');
  assert.equal(extractDelta({ response: 'bạn' }).text, 'bạn');
  assert.equal(extractDelta(null).text, '');
});

test('extractDelta: KHÔNG lấy reasoning_content', () => {
  // Model này là model reasoning; để lọt phần tự lẩm bẩm suy luận ra là khách đọc được đoạn
  // nháp của nó.
  const frame = { choices: [{ delta: { reasoning_content: 'người dùng đang hỏi giá...' } }] };
  assert.equal(extractDelta(frame).text, '');
});

test('extractDelta: lấy số neuron khi có', () => {
  assert.equal(extractDelta({ usage: { neurons: 3.5 } }).neurons, 3.5);
  assert.equal(extractDelta({ response: 'x' }).neurons, null);
});

// ---------- lib/chatPrompt.mjs ----------

const kb = {
  brand: {
    name: 'QuickTapReview',
    phone: '0388 102 842',
    zalo: 'https://zalo.me/0388102842',
    quantityPricing: 'Đặt từ 2 cái được giá tốt hơn.',
    shipping: 'Miễn phí giao hàng tại Hà Nội, kể cả khi chỉ đặt 1 cái.',
  },
  products: [
    {
      title: 'Standee để bàn A6',
      href: '/san-pham/standee',
      body: 'Đứng vững trên quầy thu ngân.',
      ticks: ['Chân đế chắc'],
      variants: [{ name: 'Mẫu A', price: '199.000 VND', description: 'nền trắng', href: '/san-pham/standee/mau-a' }],
    },
  ],
  industries: ['Quán cà phê'],
  platforms: ['Google Maps'],
  designTool: { href: '/thiet-ke-rieng' },
};

test('buildSystemPrompt: có giá và tên mẫu từ KB', () => {
  const prompt = buildSystemPrompt(kb, null);
  assert.match(prompt, /199\.000 VND/);
  assert.match(prompt, /Mẫu A/);
  assert.match(prompt, /0388 102 842/);
});

test('buildSystemPrompt: chính sách giao hàng và giá theo số lượng lọt vào prompt', () => {
  // Hai trường này khai ở siteConfig rồi chảy qua kb.json, nhưng chỉ có mặt trong prompt nếu
  // knowledgeSection() đọc tới. Đã từng khai `shipping` mà quên đọc: chat gặp câu "có freeship
  // không?" liền trả lời "mình chưa chắc" rồi đẩy khách sang hotline, ngay trước lúc chốt đơn.
  const prompt = buildSystemPrompt(kb, null);
  assert.match(prompt, /Miễn phí giao hàng tại Hà Nội/);
  assert.match(prompt, /Đặt từ 2 cái được giá tốt hơn/);
});

test('buildSystemPrompt: có luật chặn mẫu hết hàng và cấm tô vẽ', () => {
  // Mẫu hết hàng vẫn nằm trong KB kèm giá (trang sản phẩm vẫn hiện chúng), nên luật cấm mời
  // đặt phải nằm trong prompt — thiếu nó là chat bán thứ không giao được.
  const prompt = buildSystemPrompt(kb, null);
  assert.match(prompt, /Hết hàng.*KHÔNG được giới thiệu/i);
  assert.match(prompt, /Không thêm tính từ quảng cáo/i);
});

test('buildSystemPrompt: không có khối đơn khi chưa tra', () => {
  assert.doesNotMatch(buildSystemPrompt(kb, null), /Dữ liệu đơn/);
});

test('buildSystemPrompt: khối đơn KHÔNG chứa tên quán và số điện thoại', () => {
  const prompt = buildSystemPrompt(kb, {
    code: 'TK-8F3K',
    quantity: 50,
    orderDate: '2026-08-31T04:12:09.123Z',
    designUrl: 'https://res.cloudinary.com/x/TK-8F3K-mau.png',
  });
  assert.match(prompt, /TK-8F3K/);
  assert.match(prompt, /Số lượng: 50/);
  // Đây là điểm mấu chốt: lookupOrder cố tình không SELECT hai cột đó, prompt cũng không được
  // có chỗ nào nhét chúng vào.
  assert.doesNotMatch(prompt, /customer_name|Tên quán:/);
});

test('buildSystemPrompt: không khớp thì cấm nói phần nào sai', () => {
  const prompt = buildSystemPrompt(kb, { notFound: true });
  assert.match(prompt, /không tìm thấy đơn khớp/i);
  assert.match(prompt, /không nói phần nào đúng phần nào sai/i);
});

test('buildSystemPrompt: đơn từ giỏ hàng hiện đủ dòng hàng, tiền và trạng thái', () => {
  const prompt = buildSystemPrompt(kb, {
    kind: 'shop',
    code: 'TK-8F3K',
    orderDate: '2026-09-08T04:12:09.123Z',
    paymentMethod: 'transfer',
    status: 'pending_payment',
    subtotal: 796000,
    discount: 39800,
    shippingFee: 30000,
    total: 786200,
    lines: [{ name: 'Mẫu A', unitPrice: 199000, quantity: 4 }],
  });
  assert.match(prompt, /Mẫu A × 4/);
  assert.match(prompt, /786\.200đ/);
  assert.match(prompt, /CHƯA thấy tiền/, 'trả lời sai chỗ này là xác nhận nhầm đã nhận tiền');
  // Vẫn phải sạch thông tin cá nhân y như đơn thiết kế riêng.
  assert.doesNotMatch(prompt, /customer_name|Tên quán:|Địa chỉ:/);
});

test('buildSystemPrompt: luật cấm đọc lại có cả địa chỉ', () => {
  // Đơn giỏ hàng có thêm địa chỉ giao — luật cũ chỉ nêu tên quán và số điện thoại.
  assert.match(buildSystemPrompt(kb, null), /Không bao giờ đọc lại tên quán, số điện thoại hay ĐỊA CHỈ/);
});

test('buildSystemPrompt: link ảnh KHÔNG lọt vào prompt', () => {
  // kb.json có `image` cho mỗi mẫu để giỏ hàng hiện thumbnail. Prompt thì tuyệt đối không được
  // chứa chúng: model chỉ đọc chữ, mà mỗi link Cloudinary dài cả trăm ký tự — lọt vào là đốt
  // token của MỌI lượt chat cho thứ không bao giờ dùng tới.
  const withImages = {
    ...kb,
    products: kb.products.map((p) => ({
      ...p,
      variants: p.variants.map((v) => ({ ...v, image: 'https://res.cloudinary.com/x/anh-mau.png' })),
    })),
  };
  assert.doesNotMatch(buildSystemPrompt(withImages, null), /cloudinary|anh-mau\.png/i);
});
