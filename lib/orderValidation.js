// Kiểm tra thông tin đơn "Thiết kế riêng".
//
// Dùng CHUNG cho cả hai phía: components/DesignStudio.jsx (báo lỗi ngay dưới ô nhập, trước khi
// tốn công dựng ảnh và gọi mạng) và functions/api/thiet-ke-rieng.js (chốt chặn thật — trình
// duyệt thì ai cũng sửa được, một cú curl là bỏ qua sạch phần kiểm tra ở client).
//
// Một file cho cả hai để hai bên không bao giờ lệch luật: lệch nhau thì hoặc khách bị chặn
// bằng một lỗi mà form không giải thích được, hoặc form hứa hẹn hợp lệ rồi server trả 400.
// File này CỐ TÌNH không import gì — Pages Function nạp nó bằng đường dẫn tương đối, mà mọi
// thứ dính tới Next (alias @/, next/*) đều không tồn tại trong môi trường Workers.

export const LIMITS = { shop: 120, phone: 40, note: 2000, quantity: 9999 };

/** Gộp mọi khoảng trắng thành 1 dấu cách, cắt 2 đầu, chặn độ dài. */
export function cleanText(value, max) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

/**
 * Đưa số điện thoại về một dạng duy nhất: 10–11 chữ số bắt đầu bằng 0.
 *
 * Khách gõ số kiểu gì cũng nhận: có dấu cách, dấu chấm, gạch ngang, ngoặc, hay +84/0084/84 ở
 * đầu. Chuẩn hoá ngay từ đây để trong D1 không có cùng một quán nằm dưới hai dạng
 * `+84388102842` và `0388102842` — lúc tra số gọi lại sẽ không khớp.
 *
 * Trả về null nếu không phải số điện thoại Việt Nam hợp lệ.
 */
export function normalizePhone(raw) {
  const trimmed = String(raw ?? '').trim();
  // Giữ lại đúng chữ số; dấu '+' chỉ có nghĩa khi đứng đầu nên xử lý bằng tiền tố bên dưới.
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;

  let local = digits;
  if (local.startsWith('0084')) local = local.slice(4);
  else if (local.startsWith('84') && !trimmed.startsWith('0')) local = local.slice(2);
  if (!local.startsWith('0')) local = `0${local}`;

  // Di động: 03/05/07/08/09 + 8 số. Cố định: 02 + 8–9 số (quán ăn hay để số bàn cố định, chặn
  // luôn thì gọi lại cho họ bằng gì).
  if (/^0[35789]\d{8}$/.test(local) || /^02\d{8,9}$/.test(local)) return local;
  return null;
}

/**
 * Kiểm tra toàn bộ thông tin liên hệ của một đơn.
 *
 * @returns {{ ok: boolean, errors: Record<string,string>, value: { shop: string, phone: string, quantity: number, note: string } }}
 *   `errors` khoá theo tên ô để client gắn lỗi đúng chỗ; `value` là bản đã chuẩn hoá, dùng bản
 *   này để gửi/ghi chứ không dùng lại dữ liệu thô.
 */
export function validateOrder({ shop, phone, quantity, note } = {}) {
  const errors = {};

  const cleanShop = cleanText(shop, LIMITS.shop);
  if (!cleanShop) {
    errors.shop = 'Bạn cho mình xin tên quán nhé.';
  } else if (cleanShop.length < 2) {
    errors.shop = 'Tên quán ngắn quá, bạn ghi đủ giúp mình.';
  } else if (!/\p{L}/u.test(cleanShop)) {
    // Toàn số hoặc toàn ký hiệu thì gần như chắc chắn là gõ nhầm ô — số điện thoại có ô riêng
    // ngay bên dưới.
    errors.shop = 'Tên quán cần có chữ, bạn kiểm tra lại giúp mình.';
  }

  const rawPhone = cleanText(phone, LIMITS.phone);
  const normalizedPhone = normalizePhone(rawPhone);
  if (!rawPhone) {
    errors.phone = 'Bạn cho mình xin số điện thoại để gọi lại nhé.';
  } else if (!normalizedPhone) {
    errors.phone = 'Số điện thoại chưa đúng — bạn kiểm tra lại giúp mình (vd 0912 345 678).';
  }

  // Ô số lượng cho gõ tay nên nhận được cả chuỗi rỗng, số âm, số thập phân lẫn chữ.
  const rawQuantity = String(quantity ?? '').trim();
  const parsedQuantity = Number(rawQuantity);
  if (!rawQuantity || !/^\d+$/.test(rawQuantity) || parsedQuantity < 1) {
    // Ô số lượng chỉ rộng 92px nên lỗi ở đây phải ngắn, không thì nó xuống 3 dòng và đẩy cả
    // phần dưới của form trôi đi.
    errors.quantity = 'Nhập số từ 1 trở lên.';
  } else if (parsedQuantity > LIMITS.quantity) {
    errors.quantity = `Tối đa ${LIMITS.quantity}.`;
  }

  // Đo trên chuỗi ĐÃ gộp khoảng trắng: dán nhầm vài nghìn dòng trống mà bị báo "quá dài" thì
  // khách không hiểu vì sao, trong khi nội dung thật của họ rất ngắn.
  const cleanNote = cleanText(note, LIMITS.note + 1);
  if (cleanNote.length > LIMITS.note) {
    errors.note = `Ghi chú dài quá ${LIMITS.note} ký tự, bạn rút gọn giúp mình.`;
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value: {
      shop: cleanShop,
      phone: normalizedPhone || rawPhone,
      quantity: Number.isFinite(parsedQuantity) ? Math.trunc(parsedQuantity) : 1,
      note: cleanNote.slice(0, LIMITS.note),
    },
  };
}
