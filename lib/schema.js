// Dữ liệu có cấu trúc (JSON-LD) dùng chung cho mọi trang — trước đây mỗi trang tự khai một
// khối Organization gần giống nhau, sửa một chỗ là lệch với ba chỗ còn lại.
//
// VÌ SAO ĐỔI Organization -> LocalBusiness: Organization chỉ nói "có một tổ chức tên X".
// LocalBusiness nói thêm "tổ chức này ở Hà Nội, gọi được số này, giao hàng ở đây" — đó chính
// là lợi thế lớn nhất của mình so với các shop bán cùng mặt hàng (giao trong ngày tại Hà Nội)
// và là thứ Google dùng để xếp hạng cho các truy vấn kèm địa danh ("bảng nfc review hà nội").
// LocalBusiness kế thừa Organization nên mọi tham chiếu `{ '@id': ... }` cũ vẫn đúng.
import { siteConfig } from '@/lib/siteConfig';
import { parsePrice } from '@/lib/cartPricing.mjs';

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
  // KHÔNG khai `openingHours`: shop bán online, không có cửa hàng để mở/đóng cửa. Giờ mở cửa
  // bịa ra là lời hứa với khách về một chỗ không tồn tại.
  //
  // Khoảng giá THẬT đang bán: bảng NFC 99.000đ, standee 199.000đ (nguồn gốc là ô Price trên
  // Airtable, chảy ra kb.json). Phải viết tay ở đây vì localBusinessSchema là object tĩnh được
  // import đồng bộ bởi cả những trang không nạp Airtable — đổi giá trên Airtable thì nhớ sửa
  // lại dòng này, không có gì tự nhắc.
  priceRange: '99.000₫ - 199.000₫',
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

// Tình trạng còn hàng. Dữ liệu Airtable KHÔNG có cột tồn kho, nên tín hiệu duy nhất đang tồn
// tại là chữ "(Hết hàng)" người nhập gõ thẳng vào TÊN mẫu ("Standee Booking Review (Hết hàng)").
// Đọc từ tên là giải pháp tạm và phụ thuộc cách gõ — nhưng thà vậy còn hơn khai InStock cho một
// mẫu đã hết: sai tình trạng hàng là một trong những lỗi dữ liệu có cấu trúc Google xử nặng
// nhất, và khách bấm vào rồi mới biết hết hàng thì còn tệ hơn nữa.
//
// CÁCH SỬA ĐÚNG: thêm cột checkbox tồn kho trên Airtable rồi đọc nó ở lib/airtable.js, thay vì
// dò chữ trong tên.
const OUT_OF_STOCK_RE = /hết\s*hàng/i;

export function availabilityOf(variant) {
  return OUT_OF_STOCK_RE.test(variant?.name || '')
    ? 'https://schema.org/OutOfStock'
    : 'https://schema.org/InStock';
}

/**
 * Danh sách mẫu cho TRANG DANH MỤC (/san-pham/bang-nfc, /san-pham/standee).
 *
 * VÌ SAO KHÔNG phải '@type': 'Product' như trước: một trang danh mục không phải một món hàng.
 * Khai Product cho cả trang thì Google hiểu sai bản chất — mà khối đó lại thiếu cả `image` lẫn
 * `offers` nên cũng không đủ điều kiện hiện rich result, tức mất cả đôi đường. ItemList nói
 * đúng "đây là danh sách N mẫu", và mỗi mẫu mang theo ảnh + giá của CHÍNH NÓ, nhờ vậy ảnh từng
 * mẫu có đường vào kết quả tìm kiếm thay vì chỉ nằm im trong HTML.
 *
 * Mỗi mẫu giữ `url` trỏ về trang chi tiết: đó là nơi khai Product đầy đủ (xem VariantDetail),
 * còn trang danh mục chỉ tóm lược. Google đọc được cả hai tầng mà không coi là trùng lặp.
 *
 * Khai ở đây chứ không chép vào từng trang — đúng lý do đã ghi ở đầu file này.
 *
 * @param {Array} variants mẫu đã nạp, cần { id, href, name, images, price }
 * @param {{ name: string, category: string }} meta
 */
export function itemListSchema(variants, { name, category }) {
  return {
    '@type': 'ItemList',
    name,
    numberOfItems: variants.length,
    itemListElement: variants.map((v, i) => {
      // parsePrice vì ô Price trên Airtable là text tự do ('199.000 VND'), còn JSON-LD đòi số.
      // Mẫu nào không đọc ra giá thì BỎ HẲN khối offers chứ không điền 0 — giá 0đ là một lời
      // nói sai với Google, còn thiếu trường không bắt buộc thì không.
      const price = parsePrice(v.price);
      return {
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: v.name,
          url: `${siteConfig.siteUrl}${v.href}`,
          ...(v.images?.length ? { image: v.images } : {}),
          ...(v.id ? { sku: v.id } : {}),
          brand: { '@id': ORG_ID },
          category,
          ...(price
            ? {
                offers: {
                  '@type': 'Offer',
                  priceCurrency: 'VND',
                  price,
                  availability: availabilityOf(v),
                  itemCondition: 'https://schema.org/NewCondition',
                  url: `${siteConfig.siteUrl}${v.href}`,
                },
              }
            : {}),
        },
      };
    }),
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
