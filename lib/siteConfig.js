// Cấu hình trung tâm của toàn site — sửa các placeholder ở ĐÂY, không cần lục qua từng trang.
export const siteConfig = {
  brandName: 'QuickTapReview',
  brandFirst: 'QuickTap',
  brandLast: 'Review',

  // Điện thoại là kênh liên hệ duy nhất — site không dùng email.
  phoneDisplay: '0388 102 842',
  phoneHref: 'tel:0388102842',

  // Zalo dùng chính số điện thoại trên — zalo.me/<số> mở thẳng khung chat với tài khoản đó
  // (trên máy có app Zalo thì mở app, không có thì mở bản web). Số phải viết liền, không
  // dấu cách, không +84, nếu không link sẽ ra trang "không tìm thấy người dùng".
  zaloHref: 'https://zalo.me/0388102842',

  // Domain thật đang deploy (Cloudflare Pages) — trước đây để .vn nhưng domain đó chưa từng
  // đăng ký DNS (NXDOMAIN), khiến sitemap/canonical/OG/JSON-LD toàn trỏ vào chỗ không tồn
  // tại. Đổi lại nếu sau này chuyển hẳn sang domain khác.
  siteUrl: 'https://quicktapreview.shop',
  locale: 'vi_VN',
  defaultOgImage: '/assets/img/og-image.png',

  // Giá lẻ hiển thị theo từng mẫu; ưu đãi này áp dụng khi khách đặt từ 2 sản phẩm trở lên.
  // Giữ câu ngắn, không nêu mức giảm cố định vì giá cuối còn phụ thuộc mẫu khách chọn.
  quantityPricing: 'Đặt từ 2 cái được giá tốt hơn — liên hệ để nhận báo giá.',

  // VIDEO/ẢNH LỚN Ở ĐẦU TRANG CHỦ (hero) và VIDEO DEMO ở mục "Cách hoạt động"
  // KHÔNG còn khai báo link ở đây nữa — upload thẳng vào bảng "media trang chủ" trên
  // Airtable (xem getSiteMedia trong lib/airtable.js), site tự đưa lên Cloudinary lúc build.
  // Trước đây link Cloudinary bị hardcode ở file này, xoá ảnh trên Cloudinary là trang gãy
  // mà không ai biết.
  //
  // Hai câu dưới chỉ là alt mặc định, dùng khi cột Alt trong Airtable để trống.
  heroImageAlt: 'Standee QR đặt trên bàn, khách chạm điện thoại là mở trang đánh giá quán',
  demoVideoAlt: 'Video demo: khách chạm điện thoại vào standee, trang đánh giá mở ra ngay',

  // Thông tin dùng cho 3 trang pháp lý (/phap-ly, /chinh-sach-bao-mat, /dieu-khoan-su-dung).
  //
  // TODO: điền 4 ô trong ngoặc vuông bằng thông tin đăng ký kinh doanh thật. Chưa điền thì
  // trang vẫn chạy và vẫn nói đúng sự thật về cách site xử lý dữ liệu — chỉ riêng phần danh
  // tính đơn vị là còn để trống, và để trống thì rõ ràng hơn là bịa một cái tên công ty.
  //
  // `email` để rỗng là cố ý: site không dùng email, mọi liên hệ qua hotline/Zalo. Điền vào
  // thì các trang pháp lý tự hiện thêm dòng email, không cần sửa code.
  legal: {
    companyName: 'QuickTapReview',
    taxCode: '015099002883',
    address: 'Từ Liêm, Hà Nội',
    owner: 'Trần Tiến Anh',
    email: 'trantienanh99@outlook.com',
    // Ngày sửa nội dung 3 trang pháp lý gần nhất. Sửa nội dung thì nhớ sửa ngày ở đây —
    // một chính sách không ghi ngày thì người đọc không biết nó còn hiệu lực hay không.
    updatedAt: '07/09/2026',
  },

  // TODO: thay bằng số liệu thật khi có, hoặc bỏ hẳn khối thống kê nếu chưa có dữ liệu.
  stats: [
    { value: '[SỐ QUÁN]+', label: 'Quán đang sử dụng' },
    { value: '[SỐ LƯỢT]+', label: 'Lượt chạm mỗi tháng' },
    { value: '[SỐ TỈNH]+', label: 'Tỉnh, thành đã giao hàng' },
  ],
};
