// Cấu hình trung tâm của toàn site — sửa các placeholder ở ĐÂY, không cần lục qua từng trang.
export const siteConfig = {
  brandName: 'QuickTapReview',
  brandFirst: 'QuickTap',
  brandLast: 'Review',

  // Điện thoại là kênh liên hệ duy nhất — site không dùng email.
  phoneDisplay: '0388 102 842',
  phoneHref: 'tel:0388102842',

  siteUrl: 'https://quicktapreview.vn',
  locale: 'vi_VN',
  defaultOgImage: '/assets/img/og-image.png',

  // VIDEO/ẢNH LỚN Ở ĐẦU TRANG CHỦ (hero) và VIDEO DEMO ở mục "Cách hoạt động"
  // KHÔNG còn khai báo link ở đây nữa — upload thẳng vào bảng "media trang chủ" trên
  // Airtable (xem getSiteMedia trong lib/airtable.js), site tự đưa lên Cloudinary lúc build.
  // Trước đây link Cloudinary bị hardcode ở file này, xoá ảnh trên Cloudinary là trang gãy
  // mà không ai biết.
  //
  // Hai câu dưới chỉ là alt mặc định, dùng khi cột Alt trong Airtable để trống.
  heroImageAlt: 'Standee QR đặt trên bàn, khách chạm điện thoại là mở trang đánh giá quán',
  demoVideoAlt: 'Video demo: khách chạm điện thoại vào standee, trang đánh giá mở ra ngay',

  // TODO: thay bằng số liệu thật khi có, hoặc bỏ hẳn khối thống kê nếu chưa có dữ liệu.
  stats: [
    { value: '[SỐ QUÁN]+', label: 'Quán đang sử dụng' },
    { value: '[SỐ LƯỢT]+', label: 'Lượt chạm mỗi tháng' },
    { value: '[SỐ TỈNH]+', label: 'Tỉnh, thành đã giao hàng' },
  ],
};
