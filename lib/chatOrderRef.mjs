// Rút mã đơn + ứng viên số điện thoại ra khỏi câu khách gõ trong khung chat.
//
// Đây là CỬA duy nhất dẫn tới D1 trong luồng chat, nên nó cố tình chỉ làm đúng một việc:
// khoanh vùng chuỗi. Việc CHUẨN HOÁ số điện thoại vẫn nằm nguyên ở normalizePhone trong
// lib/orderValidation.js — luật số điện thoại Việt Nam chỉ được phép có một bản, chép sang
// đây là sớm muộn hai bên lệch nhau.
//
// Nhờ không import gì, file chạy được bằng `node --test` (xem test/chat.test.mjs) — mà đây
// đúng là chỗ đáng test nhất: sai một ký tự trong regex là hoặc khách tra đơn không được,
// hoặc endpoint đi hỏi D1 ở những lượt lẽ ra không nên hỏi.

// Cùng bảng chữ mà functions/api/thiet-ke-rieng.js dùng để sinh mã: 32 ký tự, đã bỏ 0/O/1/I
// cho khỏi đọc nhầm qua điện thoại. Chấp nhận khách gõ thường ('tk-8f3k') và cả khoảng trắng
// quanh dấu gạch ('TK - 8F3K') — họ đang chép lại từ tin nhắn, không phải điền form.
const ORDER_CODE = /\bTK\s*-\s*([2-9A-HJ-NP-Z]{4})\b/i;

// Khoanh vùng ứng viên số điện thoại. Rộng rãi có chủ ý: bắt hụt thì khách không tra được đơn
// dù đã gõ đúng, còn bắt thừa thì chỉ tốn một lần gọi normalizePhone và bị trả về null.
// `\(?` ở đầu: xem chú thích cùng khuôn này trong lib/chatRedact.mjs.
const PHONE_CANDIDATE = /\+?\(?\d[\d\s.\-()]{7,20}\d/g;

/**
 * Tìm mã đơn trong câu.
 * @returns {string|null} mã đã chuẩn hoá dạng 'TK-8F3K', hoặc null nếu không có.
 */
export function findOrderCode(text) {
  const match = ORDER_CODE.exec(String(text ?? ''));
  return match ? `TK-${match[1].toUpperCase()}` : null;
}

/**
 * Tìm mọi chuỗi trông như số điện thoại, theo thứ tự xuất hiện.
 *
 * Trả về MẢNG chứ không trả về một chuỗi: khách hay gõ kiểu "đơn TK-8F3K, số 0388102842, gọi
 * giúp lúc 8h" — và cũng có khi đưa hai số. Người gọi sẽ thử lần lượt qua normalizePhone rồi
 * lấy cái đầu tiên hợp lệ, thay vì đoán ngay từ đây cái nào mới là số điện thoại.
 */
export function findPhoneCandidates(text) {
  return String(text ?? '').match(PHONE_CANDIDATE) || [];
}

/**
 * Câu này có đủ HAI mảnh để đi tra đơn không?
 *
 * Đủ cả hai mới được chạm vào D1 — mã đơn chỉ có 4 ký tự từ bảng 32 (khoảng 1 triệu tổ hợp),
 * đủ để đọc qua điện thoại nhưng không đủ làm mật khẩu: ai đó quét mã bằng script sẽ moi được
 * danh sách khách hàng. Bắt buộc kèm số điện thoại thì kẻ quét phải đoán trúng cả hai.
 *
 * @param {string} text câu khách vừa gõ
 * @param {(raw: string) => string|null} normalizePhone truyền từ lib/orderValidation.js
 * @returns {{ code: string, phone: string }|null}
 */
export function findOrderRef(text, normalizePhone) {
  const code = findOrderCode(text);
  if (!code) return null;

  for (const candidate of findPhoneCandidates(text)) {
    const phone = normalizePhone(candidate);
    if (phone) return { code, phone };
  }
  return null;
}
