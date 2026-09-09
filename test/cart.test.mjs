// Test cho phần tính tiền giỏ hàng và sinh mã VietQR.
//
// Chạy: npm test  (= node --test test/)
//
// Cùng tiêu chí chọn việc để test như test/chat.test.mjs: chỉ phủ những chỗ mà sai một ký tự
// sẽ hỏng ÂM THẦM. Ở đây có hai chỗ như vậy — tính sai tiền thì khách trả nhầm số, và sai một
// ký tự độ dài trong chuỗi VietQR thì app ngân hàng báo "mã không hợp lệ" trong khi nhìn ảnh
// QR không thấy khác gì cả.
//
// Phần gọi D1 / R2 / Cloudflare cần môi trường Workers thật nên kiểm bằng `npm run preview`,
// không giả lập ở đây.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  parsePrice,
  isOutOfStock,
  discountRateFor,
  shippingFeeFor,
  catalogFromKb,
  priceCart,
} from '../lib/cartPricing.mjs';
import { crc16, asciiFold, buildVietQrPayload } from '../lib/vietQr.mjs';

// ---------- lib/cartPricing.mjs ----------

test('parsePrice: đọc đúng chuỗi mà formatPrice sinh ra', () => {
  assert.equal(parsePrice('199.000 VND'), 199000);
  assert.equal(parsePrice('99.000 VND'), 99000);
  assert.equal(parsePrice('1.500.000 VND'), 1500000);
  assert.equal(parsePrice('  249.000  VND  '), 249000);
});

test('parsePrice: từ chối mọi thứ không phải giá niêm yết', () => {
  // Ô Price trên Airtable cho gõ text tự do. Đây là lý do KHÔNG được bóc số bừa: dòng cuối
  // cùng mà lọt sẽ thành đơn giá 388.102.842đ.
  assert.equal(parsePrice(''), null);
  assert.equal(parsePrice(null), null);
  assert.equal(parsePrice(undefined), null);
  assert.equal(parsePrice('Liên hệ để biết giá'), null);
  assert.equal(parsePrice('Liên hệ 0388102842'), null);
  assert.equal(parsePrice('199000'), null, 'thiếu đuôi VND thì không phải chuỗi formatPrice sinh ra');
});

test('isOutOfStock: bắt được mẫu hết hàng theo quy ước đặt tên', () => {
  assert.equal(isOutOfStock('Mẫu A (Hết hàng)'), true);
  assert.equal(isOutOfStock('Mẫu A (hết hàng)'), true);
  assert.equal(isOutOfStock('Mau A (het hang)'), true);
  assert.equal(isOutOfStock('Mẫu A'), false);
  assert.equal(isOutOfStock(''), false);
});

const TIERS = [
  { minQty: 10, rate: 0.12 },
  { minQty: 2, rate: 0.05 },
];

test('discountRateFor: đúng ở BIÊN của từng bậc', () => {
  // Biên là chỗ duy nhất bậc giảm hay sai (>= hay >), nên test đúng vào 1/2/9/10.
  assert.equal(discountRateFor(0, TIERS), 0);
  assert.equal(discountRateFor(1, TIERS), 0);
  assert.equal(discountRateFor(2, TIERS), 0.05);
  assert.equal(discountRateFor(9, TIERS), 0.05);
  assert.equal(discountRateFor(10, TIERS), 0.12);
  assert.equal(discountRateFor(500, TIERS), 0.12);
});

const CONFIG = { quantityTiers: TIERS, freeProvinceCode: '01', flatFee: 30000 };

test('shippingFeeFor: so bằng MÃ tỉnh, chưa chọn thì trả null', () => {
  assert.equal(shippingFeeFor('01', CONFIG), 0, 'Hà Nội phải freeship');
  assert.equal(shippingFeeFor('79', CONFIG), 30000);
  assert.equal(shippingFeeFor(null, CONFIG), null, 'chưa chọn tỉnh thì CHƯA tính được, khác 0');
  assert.equal(shippingFeeFor('', CONFIG), null);
});

const kb = {
  products: [
    {
      variants: [
        { name: 'Mẫu A', price: '199.000 VND', href: '/san-pham/standee/mau-a' },
        { name: 'Mẫu B (Hết hàng)', price: '199.000 VND', href: '/san-pham/standee/mau-b' },
        { name: 'Mẫu C', price: 'Liên hệ để biết giá', href: '/san-pham/standee/mau-c' },
        { name: 'Bảng NFC A', price: '99.000 VND', href: '/san-pham/bang-nfc/mau-a' },
      ],
    },
  ],
};
const catalog = catalogFromKb(kb);

test('priceCart: cộng đúng, giảm đúng bậc, cộng phí ship', () => {
  const r = priceCart({
    items: [{ href: '/san-pham/standee/mau-a', qty: 4 }],
    catalog,
    provinceCode: '79',
    config: CONFIG,
  });
  assert.equal(r.totalQty, 4);
  assert.equal(r.subtotal, 796000);
  assert.equal(r.discountRate, 0.05);
  assert.equal(r.discount, 39800);
  assert.equal(r.shipping, 30000);
  assert.equal(r.total, 786200); // 796000 - 39800 + 30000
});

test('priceCart: Hà Nội không cộng phí ship', () => {
  const r = priceCart({
    items: [{ href: '/san-pham/standee/mau-a', qty: 4 }],
    catalog,
    provinceCode: '01',
    config: CONFIG,
  });
  assert.equal(r.shipping, 0);
  assert.equal(r.total, 756200);
});

test('priceCart: bậc giảm tính trên TỔNG đơn, không phải từng mẫu', () => {
  // 1 standee + 1 bảng NFC = 2 cái -> cả hai dòng đều được giảm.
  const r = priceCart({
    items: [
      { href: '/san-pham/standee/mau-a', qty: 1 },
      { href: '/san-pham/bang-nfc/mau-a', qty: 1 },
    ],
    catalog,
    provinceCode: '01',
    config: CONFIG,
  });
  assert.equal(r.totalQty, 2);
  assert.equal(r.subtotal, 298000);
  assert.equal(r.discountRate, 0.05);
});

test('priceCart: chặn mẫu hết hàng, mẫu chưa niêm yết, mẫu đã bị gỡ', () => {
  const r = priceCart({
    items: [
      { href: '/san-pham/standee/mau-b', qty: 1 }, // hết hàng
      { href: '/san-pham/standee/mau-c', qty: 1 }, // chưa niêm yết giá
      { href: '/san-pham/standee/da-xoa', qty: 1 }, // không còn trên Airtable
      { href: '/san-pham/standee/mau-a', qty: 0 }, // số lượng vô lý
    ],
    catalog,
    provinceCode: '01',
    config: CONFIG,
  });
  assert.equal(r.lines.length, 0);
  assert.equal(r.subtotal, 0);
  assert.deepEqual(
    r.errors.map((e) => e.reason).sort(),
    ['chua-niem-yet', 'het-hang', 'khong-ton-tai', 'so-luong-khong-hop-le']
  );
});

test('priceCart: BỎ QUA hoàn toàn giá do client gửi lên', () => {
  // Đây là chốt chặn quan trọng nhất của cả tính năng: nếu Function tin con số client gửi thì
  // một cú curl đặt được đơn 1đ.
  const r = priceCart({
    items: [{ href: '/san-pham/standee/mau-a', qty: 1, unitPrice: 1, price: 1, total: 1 }],
    catalog,
    provinceCode: '01',
    config: CONFIG,
  });
  assert.equal(r.lines[0].unitPrice, 199000);
  assert.equal(r.total, 199000);
});

test('priceCart: chưa chọn tỉnh thì KHÔNG có tổng', () => {
  const r = priceCart({
    items: [{ href: '/san-pham/standee/mau-a', qty: 1 }],
    catalog,
    provinceCode: null,
    config: CONFIG,
  });
  assert.equal(r.subtotal, 199000);
  assert.equal(r.shipping, null);
  assert.equal(r.total, null, 'phải là null để màn hình không hiện một con số sai');
});

// ---------- lib/vietQr.mjs ----------

test('crc16: khớp giá trị kiểm tra chuẩn của CRC-16/CCITT-FALSE', () => {
  // Chuỗi '123456789' -> 0x29B1 là check value chính thức của chuẩn này. Đây là mốc đối chiếu
  // với BÊN NGOÀI, không phải con số tự mình sinh ra rồi tự khớp với mình.
  assert.equal(crc16('123456789'), '29B1');
});

test('asciiFold: bỏ dấu tiếng Việt', () => {
  assert.equal(asciiFold('Quán Cà Phê Đường'), 'Quan Ca Phe Duong');
  assert.equal(asciiFold('TK-8F3K'), 'TK-8F3K');
});

test('buildVietQrPayload: dựng đúng cấu trúc TLV và CRC tự khớp', () => {
  const payload = buildVietQrPayload({
    bankBin: '970436',
    accountNo: '1234567890',
    amount: 756200,
    addInfo: 'TK-8F3K',
  });

  assert.ok(payload.startsWith('000201'), 'mở đầu bằng Payload Format Indicator');
  assert.match(payload, /010212/, 'phải là mã dùng một lần (12), không phải mã tĩnh (11)');
  assert.match(payload, /5303704/, 'tiền tệ VND');
  assert.match(payload, /5406756200/, 'số tiền phải nằm nguyên trong chuỗi');
  assert.match(payload, /5802VN/);
  assert.match(payload, /0807TK-8F3K/, 'nội dung chuyển khoản là mã đơn');
  assert.match(payload, /970436/);

  // CRC nằm ở 4 ký tự cuối và phải khớp khi tính lại trên phần đầu (đã gồm '6304').
  const body = payload.slice(0, -4);
  assert.ok(body.endsWith('6304'));
  assert.equal(payload.slice(-4), crc16(body));
});

test('buildVietQrPayload: chặn tham số sai thay vì sinh mã hỏng', () => {
  const ok = { bankBin: '970436', accountNo: '1234567890', amount: 1000, addInfo: 'TK-8F3K' };
  assert.throws(() => buildVietQrPayload({ ...ok, bankBin: '97043' }), /bankBin/);
  assert.throws(() => buildVietQrPayload({ ...ok, accountNo: 'ABC' }), /accountNo/);
  assert.throws(() => buildVietQrPayload({ ...ok, amount: 0 }), /amount/);
  assert.throws(() => buildVietQrPayload({ ...ok, amount: 1000.5 }), /amount/);
});

// ---------- lib/checkoutValidation.mjs ----------

import { readFileSync } from 'node:fs';
import { resolveAddress, validateCheckout } from '../lib/checkoutValidation.mjs';
import { normalizePhone } from './helpers/normalizePhone.mjs';

// Dùng CHÍNH file dữ liệu thật đang phục vụ khách, không phải bản giả: mục đích của các test
// dưới đây là bắt lúc danh mục địa giới bị sinh lại hỏng hoặc đổi định dạng mã.
const diaGioi = JSON.parse(readFileSync(new URL('../public/diachi.json', import.meta.url), 'utf8'));

test('diachi.json: đủ dữ liệu và có Hà Nội đúng mã freeship', () => {
  assert.ok(diaGioi.provinces.length >= 30, `chỉ có ${diaGioi.provinces.length} tỉnh/thành`);
  const hanoi = diaGioi.provinces.find((p) => p.code === '01');
  assert.ok(hanoi, 'không tìm thấy mã tỉnh 01 — freeship Hà Nội sẽ hỏng');
  assert.ok(hanoi.wards.length > 50);
  // Mã phải là chuỗi đã đệm 0. Nếu tuột thành số nguyên thì '1' !== '01' và khách Hà Nội bị
  // thu nhầm 30k mà không ai nhận ra.
  assert.match(hanoi.wards[0].code, /^\d{5}$/);
});

test('resolveAddress: tên LUÔN lấy từ danh mục, mã sai thì trả null', () => {
  const hanoi = diaGioi.provinces.find((p) => p.code === '01');
  const ok = resolveAddress(diaGioi, '01', hanoi.wards[0].code);
  assert.equal(ok.provinceCode, '01');
  assert.equal(ok.provinceName, hanoi.name);
  assert.equal(ok.wardName, hanoi.wards[0].name);

  assert.equal(resolveAddress(diaGioi, '01', '99999'), null, 'phường không thuộc tỉnh đó');
  assert.equal(resolveAddress(diaGioi, '99', '00004'), null, 'tỉnh không tồn tại');
  assert.equal(resolveAddress(diaGioi, null, null), null);
});

const goodAddress = { provinceCode: '01', provinceName: 'Thành phố Hà Nội', wardCode: '00004', wardName: 'Phường Ba Đình' };
const goodInput = {
  name: 'Quán Cà Phê Sáng',
  phone: '0388 102 842',
  addressLine: 'Số 12 ngõ 34 Đội Cấn',
  paymentMethod: 'cod',
};

test('validateCheckout: đơn hợp lệ thì chuẩn hoá số điện thoại và gắn địa chỉ', () => {
  const r = validateCheckout(goodInput, { normalizePhone, address: goodAddress, transferEnabled: true });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.value.phone, '0388102842');
  assert.equal(r.value.wardName, 'Phường Ba Đình');
});

test('validateCheckout: bắt từng ô thiếu, khoá lỗi theo tên ô', () => {
  const r = validateCheckout(
    { name: '', phone: 'abc', addressLine: '', paymentMethod: '' },
    { normalizePhone, address: null, transferEnabled: true }
  );
  assert.equal(r.ok, false);
  assert.deepEqual(Object.keys(r.errors).sort(), ['address', 'addressLine', 'name', 'paymentMethod', 'phone']);
});

test('validateCheckout: chặn chuyển khoản khi chưa cấu hình tài khoản', () => {
  // Chưa điền siteConfig.bank mà vẫn cho đặt là khách nhìn thấy mã QR trỏ vào tài khoản rỗng.
  const r = validateCheckout(
    { ...goodInput, paymentMethod: 'transfer' },
    { normalizePhone, address: goodAddress, transferEnabled: false }
  );
  assert.equal(r.ok, false);
  assert.match(r.errors.paymentMethod, /tạm không khả dụng/);
});

test('validateCheckout: từ chối phương thức thanh toán lạ', () => {
  const r = validateCheckout(
    { ...goodInput, paymentMethod: 'tra_sau_bang_niem_tin' },
    { normalizePhone, address: goodAddress, transferEnabled: true }
  );
  assert.equal(r.ok, false);
  assert.ok(r.errors.paymentMethod);
});
