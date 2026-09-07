// Bóc luồng SSE của Workers AI thành chữ để hiện cho khách.
//
// Vì sao phải bóc ở SERVER chứ không đẩy thẳng luồng gốc về trình duyệt:
//
//   1. Model @cf/google/gemma-4-26b-a4b-it là model REASONING — nó phát cả `reasoning_content`
//      (phần tự lẩm bẩm suy luận) lẫn `content`. Đẩy nguyên luồng về là khách đọc được đoạn
//      nháp đó. Lọc ở server thì không có đường nào lọt.
//   2. Workers AI có HAI dạng khung tuỳ model: dạng cũ {"response":"..."} và dạng tương thích
//      OpenAI {"choices":[{"delta":{"content":"..."}}]}. Nhận cả hai ở đây một lần, rồi phát
//      lại về client bằng đúng MỘT khung của mình — client không phải biết Cloudflare đổi gì.
//   3. Cần gom lại toàn bộ câu trả lời để ghi chat_logs, mà đọc luồng thì chỉ đọc được một
//      lần; đằng nào cũng phải đi qua đây.
//
// Không import gì để `node --test` chạy được — xem chú thích cùng chủ đề ở lib/chatRedact.mjs.

/**
 * Cắt buffer thành từng sự kiện SSE hoàn chỉnh.
 *
 * SSE ngăn cách các sự kiện bằng một dòng trống. Mảnh cuối gần như luôn dở dang (gói mạng cắt
 * giữa chừng) nên được trả lại ở `rest` để nối với lần đọc sau — bỏ qua chuyện này là thỉnh
 * thoảng mất một chữ giữa câu, kiểu lỗi rất khó tái hiện.
 *
 * @returns {{ events: string[], rest: string }}
 */
export function splitSseEvents(buffer) {
  const parts = String(buffer ?? '').split(/\r?\n\r?\n/);
  const rest = parts.pop() ?? '';
  return { events: parts, rest };
}

/**
 * Lấy phần dữ liệu của một sự kiện SSE ('data: {...}' -> '{...}').
 * Trả về null cho sự kiện không phải data (comment ':', dòng 'event:'...).
 */
export function sseData(event) {
  const lines = String(event ?? '').split(/\r?\n/);
  const data = lines
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())
    .join('');
  return data || null;
}

/**
 * Rút chữ + số neuron ra khỏi một khung JSON của Workers AI.
 *
 * CHỈ lấy `content`, KHÔNG lấy `reasoning_content` — xem lý do ở đầu file.
 *
 * `neurons` là đơn vị tính tiền của Workers AI, thường chỉ có ở khung cuối. Ghi nó vào
 * chat_logs ngay từ đầu để sau vài ngày còn biết một lượt chat thật tốn bao nhiêu mà chỉnh
 * hạn mức cho đúng, thay vì đoán.
 *
 * @returns {{ text: string, neurons: number|null }}
 */
export function extractDelta(frame) {
  if (!frame || typeof frame !== 'object') return { text: '', neurons: null };

  const choice = Array.isArray(frame.choices) ? frame.choices[0] : null;
  const text =
    // Dạng tương thích OpenAI, lúc đang phát dần.
    choice?.delta?.content ??
    // Cũng dạng đó nhưng khung gộp cả câu (một số model phát nguyên cục ở khung cuối).
    choice?.message?.content ??
    // Dạng cũ của Workers AI.
    frame.response ??
    '';

  const neurons = typeof frame.usage?.neurons === 'number' ? frame.usage.neurons : null;

  return { text: typeof text === 'string' ? text : '', neurons };
}
