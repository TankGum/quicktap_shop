// Tính tiền cho giỏ hàng — dùng CHUNG giữa trình duyệt và Pages Function.
//
// Vì sao dùng chung: trình duyệt cần con số để hiện cho khách, Function cần con số để ghi vào
// D1 và điền vào mã QR. Hai bên tự tính bằng hai đoạn code riêng thì sớm muộn cũng lệch, mà
// lệch tiền là loại lỗi khách phát hiện trước mình.
//
// Nhưng chỉ phía Function mới có THẨM QUYỀN: client gửi lên đúng { href, qty }, không bao giờ
// gửi tiền lên. Cùng lý do với lib/orderValidation.js — phần kiểm tra chạy trong trình duyệt
// thì ai cũng sửa được, một cú curl là bỏ qua sạch.
//
// Đuôi .mjs để `node --test` chạy được mà không cần bundler — xem chú thích đầu
// test/chat.test.mjs.

// Chỉ nhận ĐÚNG chuỗi mà formatPrice() (lib/airtable.js) sinh ra từ ô Price toàn chữ số:
// "199.000 VND". Cố ý KHÔNG làm kiểu "bóc hết chữ số trong chuỗi": ô Price trên Airtable cho
// gõ text tự do, và "Liên hệ 0388102842" mà bóc số sẽ thành đơn giá 388.102.842đ — bán mất
// hàng theo đúng nghĩa đen. Không khớp dạng này thì coi như chưa niêm yết giá.
const PRICE_RE = /^\s*(\d{1,3}(?:\.\d{3})*|\d+)\s*VND\s*$/;

/** '199.000 VND' -> 199000. Mọi thứ khác -> null. */
export function parsePrice(raw) {
  if (raw === undefined || raw === null) return null;
  const m = PRICE_RE.exec(String(raw));
  if (!m) return null;
  const n = Number(m[1].replace(/\./g, ''));
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

// Mẫu hết hàng vẫn nằm trong kb.json kèm giá vì trang sản phẩm vẫn hiện chúng — quy ước là
// tên có đuôi "(Hết hàng)". Chatbot đã có luật cấm mời đặt (chatPrompt.mjs); giỏ hàng phải
// chặn ở tầng dữ liệu, nếu không thì bán được thứ không giao được.
export function isOutOfStock(name) {
  return /h[ếe]t\s*h[àa]ng/i.test(String(name || ''));
}

/**
 * Bậc giảm theo TỔNG số lượng của cả đơn (không phải theo từng mẫu).
 * tiers: [{ minQty, rate }] — không cần sắp xếp trước, hàm tự chọn bậc cao nhất đạt được.
 */
export function discountRateFor(totalQty, tiers = []) {
  let rate = 0;
  for (const t of tiers) {
    if (totalQty >= t.minQty && t.rate > rate) rate = t.rate;
  }
  return rate;
}

/**
 * Phí giao theo mã tỉnh/thành. So sánh bằng MÃ chứ không bằng tên: ô địa chỉ tự do trước đây
 * viết "Hà Nôi"/"HN"/"hà nội" đủ kiểu, dò chữ là có ngày tính nhầm 30k hoặc miễn nhầm.
 * Không biết tỉnh (chưa chọn) -> trả null để bên gọi biết là CHƯA tính được, khác hẳn với 0.
 */
export function shippingFeeFor(provinceCode, { freeProvinceCode, flatFee }) {
  if (!provinceCode) return null;
  return String(provinceCode) === String(freeProvinceCode) ? 0 : flatFee;
}

/** Gom variants của mọi sản phẩm trong kb.json thành map tra theo href. */
export function catalogFromKb(kb) {
  const map = new Map();
  for (const p of kb?.products || []) {
    for (const v of p.variants || []) {
      if (v?.href) map.set(v.href, v);
    }
  }
  return map;
}

/**
 * Dựng lại toàn bộ hoá đơn từ giỏ hàng.
 *
 * @param items       [{ href, qty }] — thứ DUY NHẤT client được phép gửi lên
 * @param catalog     Map href -> variant (catalogFromKb)
 * @param provinceCode mã tỉnh/thành đã chọn, hoặc null khi khách chưa chọn
 * @param config      { quantityTiers, freeProvinceCode, flatFee }
 */
export function priceCart({ items, catalog, provinceCode, config }) {
  const lines = [];
  const errors = [];
  let subtotal = 0;
  let totalQty = 0;

  for (const raw of items || []) {
    const href = raw?.href;
    const qty = Number(raw?.qty);

    if (!Number.isInteger(qty) || qty < 1 || qty > 999) {
      errors.push({ href, reason: 'so-luong-khong-hop-le' });
      continue;
    }
    const variant = catalog.get(href);
    if (!variant) {
      // Mẫu bị gỡ khỏi Airtable sau khi khách đã bỏ vào giỏ. Giỏ nằm ở localStorage nên sống
      // lâu hơn hẳn một lần build — trường hợp này là bình thường, không phải tấn công.
      errors.push({ href, reason: 'khong-ton-tai' });
      continue;
    }
    if (isOutOfStock(variant.name)) {
      errors.push({ href, reason: 'het-hang' });
      continue;
    }
    const unitPrice = parsePrice(variant.price);
    if (unitPrice === null) {
      errors.push({ href, reason: 'chua-niem-yet' });
      continue;
    }

    // `image` chỉ để giỏ hàng vẽ thumbnail; Function bỏ qua nó khi ghi D1 (đơn chép lại tên và
    // giá, không chép ảnh — ảnh đổi theo Airtable còn đơn thì không).
    lines.push({
      href,
      name: variant.name,
      image: variant.image || null,
      unitPrice,
      qty,
      lineTotal: unitPrice * qty,
    });
    subtotal += unitPrice * qty;
    totalQty += qty;
  }

  const discountRate = discountRateFor(totalQty, config.quantityTiers);
  // Làm tròn về số nguyên đồng: VND không có phần lẻ, mà để số thực trôi vào D1 thì có ngày
  // tổng tiền hiện ra 756199.9999999999.
  const discount = Math.round(subtotal * discountRate);
  const shipping = shippingFeeFor(provinceCode, config);

  return {
    lines,
    errors,
    totalQty,
    subtotal,
    discountRate,
    discount,
    shipping,
    // Chưa chọn tỉnh thì chưa có tổng — trả null thay vì cộng đại, để màn hình buộc phải hiện
    // "chọn địa chỉ để biết phí giao" chứ không hiện một con số sai.
    total: shipping === null ? null : subtotal - discount + shipping,
  };
}
