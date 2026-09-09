// Bản sao rút gọn của normalizePhone (lib/orderValidation.js) dùng cho test.
//
// Phải chép vì file gốc là .js nên `node --test` không import được — cùng vấn đề đã ghi trong
// test/chat.test.mjs, và cũng chính là lý do lib/checkoutValidation.mjs NHẬN hàm này qua tham
// số thay vì import: luật số điện thoại thật vẫn chỉ tồn tại một chỗ, chỗ này chỉ là bản giả
// đủ dùng để kiểm phần logic còn lại.
export function normalizePhone(raw) {
  const trimmed = String(raw ?? '').trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;
  let local = digits;
  if (local.startsWith('0084')) local = local.slice(4);
  else if (local.startsWith('84') && !trimmed.startsWith('0')) local = local.slice(2);
  if (!local.startsWith('0')) local = `0${local}`;
  if (/^0[35789]\d{8}$/.test(local) || /^02\d{8,9}$/.test(local)) return local;
  return null;
}
