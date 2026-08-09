// Nội dung tiếp thị cố định của 2 dòng sản phẩm (Bảng NFC, Standee) — sửa ở ĐÂY.
//
// Các MẪU THẬT (tên, mô tả, giá, ảnh, video) thì KHÔNG sửa ở file này nữa — điền qua
// form Airtable (xem hướng dẫn đã gửi), site tự đọc lúc build. Xem lib/airtable.js.
// `variants` bên dưới chỉ là nơi thêm tay vài mẫu cố định nếu cần, không bắt buộc.

export const products = [
  {
    id: 'bang-nfc',
    href: '/san-pham/bang-nfc',
    kicker: 'Dạng 1',
    title: 'Bảng NFC 10x10cm',
    artLabel: 'Minh hoạ bảng NFC',
    // Câu ngắn dùng cho thẻ sản phẩm ngoài trang chủ (bản đầy đủ là `body` bên dưới).
    tagline: 'Bảng vuông 10x10 cm, dán lên tường, quầy hay mặt bàn.',
    body: 'Bảng phẳng 10x10 cm, tích hợp cả chip NFC và mã QR ngay trên mặt bảng. Mặt sau có keo dán chắc — dán lên tường, quầy thu ngân, mặt bàn hay menu — khách chạm hoặc quét là xong.',
    ticks: [
      'Kích thước 10x10 cm, có cả chip NFC lẫn mã QR in sẵn',
      'Chống nước, lau chùi thoải mái',
      'In logo & câu kêu gọi riêng của quán',
      'Đổi link đánh giá bất cứ lúc nào, không cần làm bảng mới',
    ],
    cta: 'Đặt bảng NFC',
    detail: 'Chi tiết bảng NFC',
    variants: [],
  },
  {
    id: 'standee',
    href: '/san-pham/standee',
    kicker: 'Dạng 2',
    title: 'Standee để bàn (QR + NFC)',
    artLabel: 'Minh hoạ standee để bàn',
    tagline: 'Đặt trên quầy thu ngân hay từng bàn, khách thấy ngay khi ngồi xuống.',
    body: 'Đứng vững trên quầy thu ngân hoặc từng bàn, khách nhìn thấy ngay khi ngồi xuống. Có cả mã QR để quét lẫn vùng NFC để chạm.',
    ticks: [
      'Chân đế chắc, không đổ khi va nhẹ',
      'Mã QR rõ, quét được từ xa 30–50 cm',
      'Mặt in theo màu & logo thương hiệu của bạn',
      'Có thể in hai mặt cho khách hai phía',
    ],
    cta: 'Đặt standee',
    detail: 'Chi tiết standee',
    variants: [],
  },
];

export function getProduct(id) {
  return products.find((p) => p.id === id);
}
