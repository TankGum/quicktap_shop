// Dựng system prompt cho khung chat.
//
// Prompt LUÔN được dựng ở server, không bao giờ nhận từ client: nếu để trình duyệt gửi lên
// thì bất kỳ ai mở DevTools cũng ghi đè được toàn bộ luật bên dưới — kể cả luật cấm bịa giá.
//
// Không import gì để `node --test` chạy được — xem chú thích cùng chủ đề ở lib/chatRedact.mjs.

const money = (v) => (v ? String(v) : 'chưa niêm yết, cần gọi hỏi');

/**
 * Đổi khối kiến thức (out/kb.json) thành chữ cho model đọc.
 *
 * Dựng bằng chữ thay vì nhét JSON thô: model đọc câu tiếng Việt tự nhiên hơn hẳn đọc dấu
 * ngoặc nhọn, mà số token còn ít hơn.
 */
function knowledgeSection(kb) {
  const lines = [];

  for (const p of kb.products || []) {
    lines.push(`### ${p.title} (trang ${p.href})`);
    if (p.body) lines.push(p.body);
    for (const tick of p.ticks || []) lines.push(`- ${tick}`);
    for (const v of p.variants || []) {
      const desc = v.description ? ` — ${v.description}` : '';
      lines.push(`- Mẫu "${v.name}": ${money(v.price)}${desc} (trang ${v.href})`);
    }
    lines.push('');
  }

  if (kb.brand?.quantityPricing) lines.push("Chính sách giá theo số lượng: " + kb.brand.quantityPricing);
  // Phải có dòng này thì khai `shipping` trong kb.json mới có tác dụng: kb.json là NGUỒN, còn
  // hàm này mới là thứ quyết định cái gì lọt vào prompt. Thiếu nó, chính sách nằm im trong
  // file mà model không thấy, rồi luật "không có trong Kiến thức thì nói chưa chắc" ở dưới
  // đẩy khách sang hotline — đúng lúc họ hỏi freeship trước khi chốt đơn.
  if (kb.brand?.shipping) lines.push('Chính sách giao hàng: ' + kb.brand.shipping);
  if (kb.industries?.length) lines.push(`Loại hình phù hợp: ${kb.industries.join(', ')}.`);
  if (kb.platforms?.length) lines.push(`Đưa khách thẳng tới: ${kb.platforms.join(', ')}.`);
  if (kb.designTool?.href) {
    lines.push(
      `Khách tự lên mẫu được tại trang ${kb.designTool.href}: chọn mẫu, tải logo lên, đổi màu nền, xem trước rồi gửi về. Gửi xong nhận ngay một mã đơn dạng TK-XXXX.`
    );
  }

  return lines.join('\n');
}

/**
 * Khối dữ liệu đơn, chỉ có mặt khi khách đã đưa ĐỦ mã đơn + số điện thoại khớp nhau.
 *
 * CỐ Ý không chứa tên quán và số điện thoại dù D1 có sẵn: khách vốn đã biết hai thứ đó, còn
 * model thì không nên có cơ hội đọc chúng ra.
 *
 * Trường hợp không khớp cũng cố ý mơ hồ — không bao giờ được nói "mã đúng nhưng số sai", vì
 * chính câu đó xác nhận mã có tồn tại, tức là biến việc quét mã thành có ích.
 */
function orderSection(order) {
  if (!order) return '';
  if (order.notFound) {
    return [
      '## Dữ liệu đơn',
      'Không tìm thấy đơn nào khớp với thông tin khách vừa đưa.',
      'Nói đúng như vậy: không tìm thấy đơn khớp, nhờ khách kiểm tra lại mã và số điện thoại,',
      'hoặc gọi hotline để được tra giúp. TUYỆT ĐỐI không suy đoán mã có tồn tại hay không,',
      'không nói phần nào đúng phần nào sai.',
    ].join('\n');
  }

  const when = new Date(order.orderDate).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  return [
    '## Dữ liệu đơn (đã xác minh khớp mã + số điện thoại)',
    `- Mã đơn: ${order.code}`,
    `- Ngày nhận đơn: ${when}`,
    `- Số lượng: ${order.quantity}`,
    order.designUrl ? `- Ảnh mẫu khách đã chốt: ${order.designUrl}` : null,
    '',
    'Hệ thống KHÔNG lưu trạng thái sản xuất/giao hàng. Khách hỏi "hàng tới đâu rồi",',
    '"bao giờ giao" thì xác nhận đã nhận đơn ngày nào, số lượng bao nhiêu, rồi mời gọi hotline',
    'để hỏi tiến độ. Không được đoán hay hứa mốc thời gian.',
  ]
    .filter((line) => line !== null)
    .join('\n');
}

/**
 * @param {object} kb   nội dung out/kb.json
 * @param {object|null} order  { code, quantity, orderDate, designUrl } | { notFound: true } | null
 * @returns {string}
 */
export function buildSystemPrompt(kb, order) {
  const brand = kb.brand || {};

  return [
    `Bạn là trợ lý tư vấn của ${brand.name || 'QuickTapReview'} — nơi bán bảng NFC và standee QR giúp quán tăng đánh giá trên Google Maps, Booking.com, TripAdvisor.`,
    '',
    '## Cách trả lời',
    '- Tiếng Việt, xưng "mình", gọi khách là "bạn". Giọng nhân viên tư vấn thật, không máy móc.',
    '- NGẮN: 2–4 câu. Đây là khung chat nhỏ trên điện thoại, không phải trang tài liệu.',
    '- Viết văn xuôi. Không dùng bảng, không tiêu đề, không in đậm.',
    // Khung chat hiện chữ THÔ (white-space: pre-wrap), không dịch markdown — model trả về
    // "* Bảng NFC: ..." thì khách nhìn thấy đúng dấu sao đó nằm chình ình.
    '- Cần liệt kê thì mỗi ý một dòng, mở đầu bằng dấu gạch ngang "-". TUYỆT ĐỐI không dùng dấu sao (*) hay dấu thăng (#).',
    '',
    '## Luật bắt buộc',
    '- CHỈ nói về sản phẩm, giá, tính năng dựa trên phần "Kiến thức" bên dưới.',
    `- Không có trong phần đó thì nói thẳng là mình chưa chắc, rồi mời gọi ${brand.phone || 'hotline'} hoặc nhắn Zalo cùng số. TUYỆT ĐỐI không đoán, không bịa.`,
    '- Không bao giờ tự nghĩ ra giá, khuyến mãi, thời gian giao hàng, chính sách đổi trả, bảo hành hay số liệu thống kê.',
    '- Khi khách đặt từ 2 cái, nói đúng chính sách giá theo số lượng trong phần Kiến thức; không tự nghĩ ra mức giảm cụ thể.',
    // Model hay tô thêm tính từ nghe hay ho ("mica TRONG SUỐT CAO CẤP" trong khi KB chỉ ghi
    // "mica"). Nghe vô hại, nhưng đó là hứa hẹn về hàng hoá mà không ai kiểm chứng được.
    '- Mô tả sản phẩm bằng ĐÚNG chữ trong phần Kiến thức. Không thêm tính từ quảng cáo (cao cấp, trong suốt, bền bỉ, sang trọng...) nếu phần đó không ghi.',
    // Mẫu hết hàng vẫn nằm trong KB kèm giá (tên có đuôi "(Hết hàng)"), vì trang sản phẩm
    // vẫn hiện chúng. Không có luật này thì chat vô tư mời khách đặt thứ không giao được.
    '- Mẫu nào có chữ "Hết hàng" trong tên thì KHÔNG được giới thiệu hay mời khách đặt. Khách hỏi đúng mẫu đó thì báo đang hết hàng và gợi ý mẫu khác cùng loại.',
    '- Khách có ý muốn đặt: mời họ tự lên mẫu ở trang /thiet-ke-rieng, hoặc gọi hotline nếu muốn nói chuyện trực tiếp.',
    '- Khách hỏi về đơn đã đặt mà chưa đưa đủ thông tin: xin cả MÃ ĐƠN (dạng TK-XXXX) và SỐ ĐIỆN THOẠI đã dùng lúc đặt. Cần đủ cả hai mới tra được, đó là để bảo vệ thông tin của khách.',
    '- Không bao giờ đọc lại tên quán hay số điện thoại của khách từ dữ liệu đơn.',
    '- Bạn không đặt được đơn, không sửa được đơn, không huỷ được đơn. Những việc đó phải qua hotline.',
    '',
    `## Liên hệ`,
    `Hotline & Zalo: ${brand.phone || ''}${brand.zalo ? ` (${brand.zalo})` : ''}`,
    '',
    '## Kiến thức',
    knowledgeSection(kb),
    orderSection(order),
  ]
    .filter(Boolean)
    .join('\n')
    .trim();
}
