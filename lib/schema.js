// Dữ liệu có cấu trúc (JSON-LD) dùng chung cho mọi trang — trước đây mỗi trang tự khai một
// khối Organization gần giống nhau, sửa một chỗ là lệch với ba chỗ còn lại.
//
// VÌ SAO ĐỔI Organization -> LocalBusiness: Organization chỉ nói "có một tổ chức tên X".
// LocalBusiness nói thêm "tổ chức này ở Hà Nội, gọi được số này, giao hàng ở đây" — đó chính
// là lợi thế lớn nhất của mình so với các shop bán cùng mặt hàng (giao trong ngày tại Hà Nội)
// và là thứ Google dùng để xếp hạng cho các truy vấn kèm địa danh ("bảng nfc review hà nội").
// LocalBusiness kế thừa Organization nên mọi tham chiếu `{ '@id': ... }` cũ vẫn đúng.
import { siteConfig } from '@/lib/siteConfig';

export const ORG_ID = `${siteConfig.siteUrl}/#org`;

export const localBusinessSchema = {
  '@type': 'LocalBusiness',
  '@id': ORG_ID,
  name: siteConfig.brandName,
  url: `${siteConfig.siteUrl}/`,
  image: `${siteConfig.siteUrl}${siteConfig.defaultOgImage}`,
  logo: `${siteConfig.siteUrl}${siteConfig.defaultOgImage}`,
  telephone: siteConfig.phoneDisplay,
  email: siteConfig.legal.email || undefined,
  // Zalo là kênh liên hệ thật thứ hai của shop; sameAs giúp Google nối site với tài khoản đó
  // thay vì coi hai thứ là hai thực thể không liên quan.
  sameAs: [siteConfig.zaloHref],
  address: {
    '@type': 'PostalAddress',
    addressLocality: siteConfig.legal.address,
    addressCountry: 'VN',
  },
  areaServed: 'VN',
  description:
    'Cung cấp bảng NFC và standee QR giúp quán ăn, khách sạn, cà phê, spa tăng số lượng đánh giá trên Google Maps, Booking.com và TripAdvisor. Giao hàng toàn quốc, trong ngày tại Hà Nội.',
  // TODO: điền `priceRange` (ví dụ '99.000₫ - 250.000₫') và `openingHours` khi chốt được
  // khung giờ nhận đơn. Cố ý để trống thay vì bịa — Google phạt dữ liệu có cấu trúc sai lệch
  // nặng hơn nhiều so với việc thiếu một trường không bắt buộc.
};

// Không còn dùng riêng nữa nhưng giữ tên cũ cho các trang chỉ cần thông tin liên hệ.
export const contactPointSchema = {
  '@type': 'ContactPoint',
  telephone: siteConfig.phoneDisplay,
  contactType: 'sales',
  areaServed: 'VN',
  availableLanguage: 'Vietnamese',
};

export const websiteSchema = {
  '@type': 'WebSite',
  '@id': `${siteConfig.siteUrl}/#website`,
  url: `${siteConfig.siteUrl}/`,
  name: siteConfig.brandName,
  inLanguage: 'vi',
  publisher: { '@id': ORG_ID },
};

// Đường dẫn phân cấp hiện trên kết quả tìm kiếm ("quicktapreview.shop > Bảng NFC > Mẫu X")
// thay cho URL trần. Google cần biết trang con thuộc nhánh nào; site có 2 tầng sản phẩm mà
// trước đây không khai gì cả nên mọi trang trông như thể nằm ngang hàng ở gốc.
//
// items: [{ name, href }] — href là đường dẫn tương đối, trang cuối cùng chính là trang hiện tại.
export function breadcrumbSchema(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${siteConfig.siteUrl}${item.href}`,
    })),
  };
}

export function faqSchema(faqs) {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}
