// Ẩn danh hoá nội dung chat TRƯỚC khi ghi vào D1 (bảng chat_logs).
//
// Vì sao cần: khung chat vừa tư vấn vừa tra đơn, nên khách sẽ tự gõ số điện thoại và mã đơn
// của họ vào đó. Ghi thẳng nguyên văn là biến chat_logs thành nơi chứa PII thứ hai bên cạnh
// design_orders — trong khi thứ thật sự đáng đọc lại chỉ là "khách hay hỏi gì", không cần
// biết ai hỏi.
//
// File này CỐ TÌNH không import gì, vì hai lý do: Pages Function nạp nó bằng đường dẫn tương
// đối (mọi thứ dính tới Next — alias @/, next/* — đều không tồn tại trong môi trường Workers),
// và `node --test` chạy được trực tiếp. Đuôi .mjs là bắt buộc cho vế thứ hai: repo không đặt
// "type": "module" nên node thuần đọc file .js có `export` sẽ báo Unexpected token.

// Bắt một chuỗi trông như số điện thoại: chữ số xen dấu cách/chấm/gạch/ngoặc, có thể có '+'
// ở đầu. Regex chỉ khoanh vùng ỨNG VIÊN — số chữ số mới là thứ quyết định, xem replacer.
// `\(?` ở đầu là bắt buộc: số cố định hay được viết '(028) 3822 1234', mà nếu khuôn bắt
// đầu bằng chữ số thì nó nhảy vào GIỮA ngoặc và chừa lại dấu '(' — ra '([SĐT]'.
const PHONE_LIKE = /\+?\(?\d[\d\s.\-()]{7,20}\d/g;

// Mã đơn do functions/api/thiet-ke-rieng.js sinh ra: TK- + 4 ký tự từ bảng 32 (đã bỏ 0/O/1/I).
const ORDER_CODE = /\bTK-[0-9A-Z]{4}\b/gi;

const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/g;

/**
 * Thay mọi số điện thoại bằng [SĐT].
 *
 * Đếm CHỮ SỐ chứ không tin độ dài chuỗi: '+84 388 102 842', '(028) 3822 1234' và
 * '0388.102.842' đều là số điện thoại, còn '2026' hay 'số lượng 100' thì không.
 *
 * Ngưỡng 9–12 chữ số cố ý rộng hơn luật thật ở lib/orderValidation.js. Đây là bộ lọc quyền
 * riêng tư, không phải bộ kiểm tra hợp lệ: bắt nhầm một con số vô hại chỉ làm log khó đọc hơn
 * một chút, còn bỏ sót một số điện thoại thật là hỏng đúng việc nó sinh ra để làm.
 */
export function redactPhones(text) {
  return String(text ?? '').replace(PHONE_LIKE, (match) => {
    const digits = match.replace(/\D/g, '');
    return digits.length >= 9 && digits.length <= 12 ? '[SĐT]' : match;
  });
}

/**
 * Ẩn danh hoá đầy đủ: email -> mã đơn -> số điện thoại.
 *
 * Thứ tự đó là cố ý. Email đi trước vì phần trước dấu @ có thể chứa một dãy số dài và sẽ bị
 * bộ lọc điện thoại xé đôi thành '[SĐT]@gmail.com' — vẫn lộ ra là có email, mà lại khó đọc.
 * Mã đơn đi trước số điện thoại vì TK-8F3K quá ngắn để lọt bộ lọc kia, nhưng đặt sau thì
 * không có gì đảm bảo khi luật đổi.
 */
export function redact(text) {
  const withoutEmail = String(text ?? '').replace(EMAIL, '[EMAIL]');
  const withoutCode = withoutEmail.replace(ORDER_CODE, '[MÃ ĐƠN]');
  return redactPhones(withoutCode);
}
