// Đếm lượt gọi theo cửa sổ cố định, lưu trên KV — dùng CHUNG cho mọi endpoint trong
// functions/ (nhận đơn thiết kế riêng, khung chat).
//
// Trước đây bộ đếm này nằm ngay trong functions/api/thiet-ke-rieng.js. Tách ra vì cùng lý do
// lib/orderValidation.js tồn tại: hai bản sao của một luật thì sớm muộn lệch nhau, mà lệch ở
// đây nghĩa là một endpoint âm thầm mất lớp chặn spam trong khi nhìn từ ngoài vẫn bình thường.
//
// File CỐ TÌNH không import gì: Pages Function nạp bằng đường dẫn tương đối, mà mọi thứ dính
// tới Next (alias @/, next/*) đều không tồn tại trong môi trường Workers.

/**
 * Ghi nhận một lượt và cho biết còn được phép không.
 *
 * Cửa sổ CỐ ĐỊNH chứ không trượt: mỗi lượt chỉ tốn 1 lần đọc + 1 lần ghi, trong khi cửa sổ
 * trượt phải giữ cả danh sách mốc thời gian. Đổi lại, ngay ranh giới hai cửa sổ có thể lọt
 * gần gấp đôi hạn mức trong chốc lát — với các mức đang dùng thì chuyện đó vô hại.
 *
 * KV chỉ "cuối cùng cũng nhất quán", nên vài request bắn cùng lúc qua các máy chủ biên khác
 * nhau có thể cùng đọc ra một con số cũ và lọt qua. Muốn đếm chính xác tuyệt đối phải dùng
 * Durable Object; ở quy mô này thì không đáng đổi lấy thêm hạ tầng.
 *
 * @returns {Promise<{ ok: boolean, retryAfter?: number }>} retryAfter tính bằng giây.
 */
export async function hitLimit(kv, key, windowSec, max) {
  const now = Math.floor(Date.now() / 1000);
  const bucket = Math.floor(now / windowSec);
  const k = `rl:${key}:${bucket}`;

  const used = parseInt(await kv.get(k), 10) || 0;
  if (used >= max) {
    return { ok: false, retryAfter: (bucket + 1) * windowSec - now };
  }
  // expirationTtl dài hơn cửa sổ một chút, để bản ghi không hết hạn ngay trước lúc cửa sổ
  // đóng và làm bộ đếm bị xoá trắng giữa chừng.
  await kv.put(k, String(used + 1), { expirationTtl: windowSec + 60 });
  return { ok: true };
}

/**
 * Chạy lần lượt các hạn mức theo IP rồi tới trần chung của endpoint; dừng ở cái đầu tiên chặn.
 *
 * Trần chung là cái van cuối: IP thì đổi được (VPN, botnet), nên cần một mức không phụ thuộc
 * IP để không ai đốt hết hạn mức của mình trong một đêm.
 *
 * @param {string} scope tên endpoint — để hai endpoint không dùng chung bộ đếm của nhau.
 */
export async function checkRateLimit(kv, scope, ip, ipLimits, globalLimit) {
  for (const { windowSec, max } of ipLimits) {
    const r = await hitLimit(kv, `${scope}:ip:${ip}:${windowSec}`, windowSec, max);
    if (!r.ok) return r;
  }
  return hitLimit(kv, `${scope}:all`, globalLimit.windowSec, globalLimit.max);
}
