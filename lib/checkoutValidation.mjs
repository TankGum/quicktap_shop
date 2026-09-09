// Kiểm tra thông tin đặt hàng từ giỏ (/gio-hang).
//
// Dùng CHUNG client + Pages Function, cùng lý do đã ghi ở lib/orderValidation.js: lệch luật
// giữa hai bên thì hoặc khách bị chặn bởi lỗi form không giải thích được, hoặc form hứa hợp lệ
// rồi server trả 400.
//
// Vì sao KHÔNG nhét thêm vào lib/orderValidation.js: file đó là .js nên `node --test` không
// import được (xem chú thích trong test/chat.test.mjs). File này để .mjs và NHẬN normalizePhone
// qua tham số thay vì import — đúng cách findOrderRef(text, normalize) đã làm, để luật số điện
// thoại vẫn chỉ tồn tại ở một chỗ duy nhất mà chỗ này vẫn test được.

export const LIMITS = { name: 120, phone: 40, addressLine: 200, note: 1000 };

const clean = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

/**
 * Đổi cặp mã (tỉnh, phường) thành địa chỉ có TÊN, lấy từ danh mục.
 *
 * Tên KHÔNG BAO GIỜ lấy từ dữ liệu client gửi lên — client chỉ được gửi mã. Nhận tên từ client
 * thì đơn trong D1 ghi được "Phường Ba Đình, Thành phố Hồ Chí Minh", hoặc tệ hơn là ghi một
 * chuỗi do người khác soạn vào chỗ mình sẽ đọc lại sau này.
 *
 * @returns {{provinceCode,provinceName,wardCode,wardName}|null} null khi mã không có thật.
 */
export function resolveAddress(diaGioi, provinceCode, wardCode) {
  const province = (diaGioi?.provinces || []).find((p) => p.code === String(provinceCode ?? ''));
  if (!province) return null;
  const ward = (province.wards || []).find((w) => w.code === String(wardCode ?? ''));
  if (!ward) return null;
  return {
    provinceCode: province.code,
    provinceName: province.name,
    wardCode: ward.code,
    wardName: ward.name,
  };
}

/**
 * @param input   dữ liệu thô từ form
 * @param deps.normalizePhone  hàm chuẩn hoá SĐT (lib/orderValidation.js)
 * @param deps.address         kết quả resolveAddress, hoặc null nếu mã sai/chưa chọn
 * @param deps.transferEnabled đã cấu hình tài khoản ngân hàng chưa (siteConfig.bank)
 */
export function validateCheckout(input = {}, { normalizePhone, address, transferEnabled } = {}) {
  const errors = {};

  const name = clean(input.name, LIMITS.name);
  if (!name) errors.name = 'Bạn cho mình xin tên người nhận nhé.';
  else if (name.length < 2) errors.name = 'Tên ngắn quá, bạn ghi đủ giúp mình.';
  else if (!/\p{L}/u.test(name)) errors.name = 'Tên cần có chữ, bạn kiểm tra lại giúp mình.';

  const rawPhone = clean(input.phone, LIMITS.phone);
  const phone = normalizePhone ? normalizePhone(rawPhone) : null;
  if (!rawPhone) errors.phone = 'Bạn cho mình xin số điện thoại để gọi giao hàng nhé.';
  else if (!phone) errors.phone = 'Số điện thoại chưa đúng — bạn kiểm tra lại giúp mình (vd 0912 345 678).';

  if (!address) errors.address = 'Bạn chọn tỉnh/thành và phường/xã giúp mình.';

  const addressLine = clean(input.addressLine, LIMITS.addressLine);
  if (!addressLine) errors.addressLine = 'Bạn ghi số nhà và tên đường giúp mình.';
  else if (addressLine.length < 5) errors.addressLine = 'Địa chỉ ngắn quá, shipper sẽ khó tìm.';

  // Chỉ nhận đúng hai giá trị. Nhận bừa rồi ghi thẳng vào D1 là cột payment_method có ngày
  // chứa chuỗi lạ, và mọi câu lệnh đếm đơn sau này đều sai mà không ai để ý.
  const paymentMethod = String(input.paymentMethod ?? '');
  if (paymentMethod !== 'cod' && paymentMethod !== 'transfer') {
    errors.paymentMethod = 'Bạn chọn hình thức thanh toán giúp mình.';
  } else if (paymentMethod === 'transfer' && !transferEnabled) {
    // Chưa điền siteConfig.bank mà vẫn cho đặt chuyển khoản thì khách sẽ nhìn thấy mã QR trỏ
    // vào tài khoản rỗng — tiền đi đâu không ai biết.
    errors.paymentMethod = 'Chuyển khoản đang tạm không khả dụng, bạn chọn thanh toán khi nhận hàng giúp mình.';
  }

  const note = clean(input.note, LIMITS.note + 1);
  if (note.length > LIMITS.note) errors.note = `Ghi chú dài quá ${LIMITS.note} ký tự, bạn rút gọn giúp mình.`;

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value: {
      name,
      phone: phone || rawPhone,
      addressLine,
      paymentMethod,
      note: note.slice(0, LIMITS.note),
      ...(address || {}),
    },
  };
}
