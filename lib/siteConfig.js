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

  // Mã xác minh Google Search Console. Vào search.google.com/search-console, thêm tài sản
  // dạng "Tiền tố URL" cho https://quicktapreview.shop, chọn cách xác minh "Thẻ HTML", rồi
  // dán riêng phần content="..." vào đây (chỉ chuỗi mã, không dán cả thẻ <meta>).
  // Để rỗng thì site không in thẻ nào ra cả — an toàn, không phải thẻ rỗng vô nghĩa.
  //
  // Cách xác minh qua bản ghi DNS TXT trên Cloudflare cũng được và bền hơn (không phụ thuộc
  // vào việc deploy lại); nếu chọn cách đó thì cứ để ô này rỗng.
  googleSiteVerification: '',
  locale: 'vi_VN',
  defaultOgImage: '/assets/img/og-image.png',

  // Chính sách giao hàng, khai MỘT chỗ vì hai nơi cần đọc nó: kb.json (để chatbot trả lời
  // được) và dữ liệu có cấu trúc `shippingDetails` trong JSON-LD của từng mẫu. Sửa ở đây là
  // cả hai cùng đổi — chép tay sang từng chỗ thì sớm muộn cũng lệch nhau.
  //
  // Cả hai vùng đều có con số cố định kể từ khi có giỏ hàng. Trước đây tỉnh khác cố ý để ngỏ
  // ("báo lúc xác nhận đơn"), nhưng giỏ hàng bắt buộc phải hiện một tổng tiền dứt khoát, và
  // chuyển khoản thì càng không thể yêu cầu khách chuyển một số tiền chưa chốt.
  shippingFreeRegion: 'Hà Nội',
  // Mã tỉnh/thành theo danh mục đơn vị hành chính (Hà Nội = 01). Giỏ hàng so bằng MÃ chứ không
  // bằng tên: ô địa chỉ tự do trước đây khách viết "Hà Nôi", "HN", "hà nội" đủ kiểu, dò chữ là
  // có ngày thu nhầm 30k của khách Hà Nội hoặc miễn nhầm cho khách tỉnh.
  shippingFreeProvinceCode: '01',
  // Phí giao cố định cho các tỉnh còn lại. Có con số cố định thì tổng tiền trong giỏ mới là số
  // CUỐI CÙNG — điều kiện bắt buộc để gắn số tiền sẵn vào mã QR chuyển khoản.
  shippingFlatFee: 30000,
  shippingPolicy:
    'Miễn phí giao hàng tại Hà Nội, kể cả khi chỉ đặt 1 cái — không có mức đơn tối thiểu. Các tỉnh thành khác phí giao 30.000đ, giao toàn quốc.',

  // Bậc giảm theo TỔNG số lượng của cả đơn (không phải theo từng mẫu). Khai ở đây rồi chảy ra
  // kb.json cho giỏ hàng và chatbot cùng đọc — xem lib/cartPricing.mjs.
  quantityTiers: [
    { minQty: 10, rate: 0.12 },
    { minQty: 2, rate: 0.05 },
  ],

  // Tài khoản nhận chuyển khoản. ĐỂ TRỐNG thì trang thanh toán chỉ hiện COD và ẩn hẳn lựa chọn
  // chuyển khoản — cố ý như vậy: thà thiếu một cách trả tiền còn hơn hiện mã QR trỏ vào tài
  // khoản rỗng rồi khách chuyển tiền đi đâu không ai biết.
  //
  // `bin` là mã ngân hàng 6 chữ số theo Napas (vd Vietcombank 970436, Techcombank 970407,
  // MB 970422, VietinBank 970415, BIDV 970418, ACB 970416, VPBank 970432, TPBank 970423).
  // `accountName` viết KHÔNG DẤU, in hoa — đúng cách ngân hàng hiển thị.
  bank: {
    bin: '970407',
    accountNo: '19033219529011',
    accountName: 'TRAN TIEN ANH',
    bankName: 'TECHCOMBANK',
  },

  // Câu mô tả bậc giảm cho người đọc (trang sản phẩm + chatbot). Con số ở đây PHẢI khớp với
  // quantityTiers bên trên — lệch nhau là chatbot báo một đằng, giỏ hàng tính một nẻo.
  quantityPricing: 'Từ 2 cái giảm 5%, từ 10 cái giảm 12% (áp cho hình thức mua đứt) — giỏ hàng tự tính, không cần hỏi giá.',

  // HAI CÁCH MUA, BA CON SỐ GIÁ — mỗi con số một cột trên Airtable (xem lib/airtable.js):
  //   Giá mua đứt      = cột "Price"
  //   Giá trả lúc mua  = cột "Upfront Price" (hình thức trả theo tháng, đã gồm tháng đầu)
  //   Phí hằng tháng   = cột "Monthly Fee"   (từ tháng thứ 2)
  // Mẫu để trống Upfront Price thì chỉ bán mua đứt — không đoán giá thay người bán.
  //
  // `fee` là PHÍ HẰNG THÁNG MẶC ĐỊNH, dùng khi cột Monthly Fee để trống. PHẢI khớp phí duy trì
  // mặc định trong phần Cài đặt của trang admin quản lý thẻ. Đổi
  // bên đó thì sửa ở đây rồi build lại — hai nơi lệch nhau là site hứa một giá, nhắc phí một
  // giá. Thẻ đã bán giữ nguyên giá lúc bán (admin quản lý), site chỉ hiện giá cho đơn MỚI.
  //
  // Bậc giảm theo số lượng (quantityTiers) KHÔNG áp cho dòng trả theo tháng: giá lúc mua đã
  // thấp sẵn. Dòng trả theo tháng vẫn được đếm vào tổng số lượng để xét bậc cho dòng mua đứt.
  monthlyPlan: {
    fee: 10000,
    maxPrepayMonths: 24,
    remindDaysBefore: 7,
  },
  // Câu chữ hai cách mua — dùng chung cho trang sản phẩm, giỏ hàng, kb.json (chatbot đọc).
  plans: {
    buy: {
      label: 'Mua đứt',
      short: 'Trả một lần, dùng trọn đời. Không phí duy trì.',
    },
    monthly: {
      label: 'Trả theo tháng',
      short: 'Trả một khoản nhỏ lúc mua (đã gồm tháng đầu), từ tháng thứ 2 đóng phí hằng tháng. Chuyển khoản tiện lợi, nhắc hạn trước 7 ngày.',
    },
  },
  // Chính sách đầy đủ cho chatbot và FAQ. Con số PHẢI khớp monthlyPlan ở trên.
  monthlyPolicy:
    'Trả theo tháng: lúc mua trả "giá trả lúc mua" ghi ở từng mẫu (thấp hơn giá mua đứt, đã gồm tháng đầu tiên). Từ tháng thứ hai mỗi tháng trả phí hằng tháng (mức phí ghi ở từng mẫu) cho mỗi thẻ bằng chuyển khoản, nội dung chuyển khoản là mã thẻ. Trả trước nhiều tháng một lần được, tối đa 24 tháng. Hạn tính theo ngày (mua 15/11 thì hạn 15/12). Đóng sớm thì hạn mới cộng nối tiếp hạn cũ, không mất ngày nào. Khoảng 7 ngày trước hạn sẽ có tin nhắn nhắc. Quá hạn chưa đóng thì thẻ có thể bị tạm ngưng: ai chạm hoặc quét sẽ thấy trang "Thẻ tạm ngưng do chưa thanh toán" kèm số tiền và mã VietQR để chủ quán trả ngay. Đóng lúc đã bị ngưng thì hạn mới tính từ ngày đóng, không phải trả cho những ngày bị ngưng. Đóng xong thẻ chạy lại ngay khi xác nhận đã nhận tiền, giữ nguyên cửa hàng và link review, không phải cài lại. Mua đứt: trả một lần, dùng mãi, không phí duy trì, không bao giờ hết hạn.',

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
    updatedAt: '19/11/2026',
  },

  // TODO: thay bằng số liệu thật khi có, hoặc bỏ hẳn khối thống kê nếu chưa có dữ liệu.
  stats: [
    { value: '[SỐ QUÁN]+', label: 'Quán đang sử dụng' },
    { value: '[SỐ LƯỢT]+', label: 'Lượt chạm mỗi tháng' },
    { value: '[SỐ TỈNH]+', label: 'Tỉnh, thành đã giao hàng' },
  ],
};
