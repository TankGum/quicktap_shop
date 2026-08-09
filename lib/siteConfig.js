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

  // VIDEO/ẢNH LỚN Ở ĐẦU TRANG CHỦ (hero).
  // Muốn đổi: upload lên Cloudinary → copy "Secure URL" → thay vào `heroVideo`
  // (video/upload/...) hoặc `heroImage` (image/upload/...). Có video thì ưu tiên phát
  // video, ảnh chỉ dùng làm poster (khung hình hiện ra trước khi video tải/phát được).
  heroVideo: 'https://res.cloudinary.com/dafrqitiv/video/upload/v1786286111/final_mrcefn.mp4',
  heroImage: 'https://res.cloudinary.com/dafrqitiv/image/upload/v1786262861/quicktap-products/hyedc07x7kmchy3m6tbd.jpg',
  heroImageAlt: 'Standee QR đặt trên bàn, khách chạm điện thoại là mở trang đánh giá quán',

  // VIDEO DEMO ở mục "Cách hoạt động" — quay cảnh khách chạm/quét thật.
  // TODO: đang dùng TẠM video có sẵn. Khi quay được clip demo thật:
  //   upload lên Cloudinary → copy "Secure URL" → thay vào `demoVideo`.
  demoVideo: 'https://res.cloudinary.com/dafrqitiv/video/upload/v1786257999/demo_video_ixa9sq.mp4',
  demoVideoAlt: 'Video demo: khách chạm điện thoại vào standee, trang đánh giá mở ra ngay',

  // TODO: thay bằng số liệu thật khi có, hoặc bỏ hẳn khối thống kê nếu chưa có dữ liệu.
  stats: [
    { value: '[SỐ QUÁN]+', label: 'Quán đang sử dụng' },
    { value: '[SỐ LƯỢT]+', label: 'Lượt chạm mỗi tháng' },
    { value: '[SỐ TỈNH]+', label: 'Tỉnh, thành đã giao hàng' },
  ],
};
