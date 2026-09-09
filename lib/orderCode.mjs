// Sinh mã đơn dùng chung cho MỌI luồng đặt hàng (thiết kế riêng + giỏ hàng).
//
// Trước đây hàm này nằm private trong functions/api/thiet-ke-rieng.js. Tách ra vì lý do y hệt
// lúc tách lib/kvRateLimit.mjs: hai bản sao của cùng một luật thì sớm muộn lệch nhau, mà lệch
// bảng chữ cái ở đây nghĩa là hai luồng sinh ra hai họ mã khác nhau — trong khi cả hai cùng
// ghi vào cột `code` và khách thì đọc mã qua điện thoại cho cùng một người.
//
// Bảng chữ bỏ 0/O và 1/I: qua điện thoại không ai phân biệt được "không" với "ô".

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function orderCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return `TK-${[...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join('')}`;
}

/** Dạng mã hợp lệ — dùng cho cả lib/chatOrderRef.mjs lẫn phần tra đơn. */
export const ORDER_CODE_RE = /^TK-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/;
