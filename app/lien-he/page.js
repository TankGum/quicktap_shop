import Link from 'next/link';
import Reveal from '@/components/Reveal';
import JsonLd from '@/components/JsonLd';
import FaqAccordion from '@/components/FaqAccordion';
import { siteConfig } from '@/lib/siteConfig';
import { PhoneIcon } from '@/components/icons';
import { localBusinessSchema, contactPointSchema, faqSchema, breadcrumbSchema } from '@/lib/schema';

// "Liên hệ đặt hàng" đúng nhưng trống rỗng với công cụ tìm kiếm — hàng triệu trang có tiêu đề
// y hệt. Thêm chính món đang bán vào tiêu đề để trang này còn có cơ hội xuất hiện với truy vấn
// dạng "mua bảng nfc đánh giá google ở hà nội".
const ogTitle = 'Đặt bảng NFC & standee QR đánh giá Google';
const ogDescription = 'Freeship Hà Nội, đặt 1 cái cũng giao. Gọi ngay để đặt bảng NFC / standee QR đánh giá cho quán của bạn.';

export const metadata = {
  title: ogTitle,
  description:
    'Freeship Hà Nội, đặt 1 cái cũng giao. Gọi ngay để đặt bảng NFC / standee QR đánh giá Google Maps cho quán của bạn — tư vấn nhanh, chỉ cần tên và địa chỉ quán, giao hàng toàn quốc.',
  alternates: { canonical: '/lien-he' },
  openGraph: { url: '/lien-he', title: ogTitle, description: ogDescription },
  twitter: { title: ogTitle, description: ogDescription },
};

const faqs = [
  {
    q: 'Khách có cần cài app để dùng bảng NFC không?',
    a: 'Không. iPhone và điện thoại Android đời mới đều đọc được NFC sẵn, và camera có thể quét mã QR trực tiếp. Khách chỉ cần chạm hoặc quét là trang đánh giá mở ra.',
  },
  {
    q: 'Bảng NFC / standee dẫn tới nền tảng đánh giá nào?',
    a: 'Tuỳ bạn chọn: Google Maps, Booking.com, TripAdvisor, Agoda, Facebook hoặc bất kỳ đường dẫn nào khác.',
  },
  {
    q: 'Đổi link đánh giá sau này có phải làm bảng mới không?',
    a: 'Không cần. Chúng tôi trỏ lại đích đến cho bạn, chiếc bảng và standee đang dán/đặt tại quán vẫn dùng bình thường.',
  },
  {
    q: 'Có mất phí giao hàng không?',
    a: 'Giao hàng tại Hà Nội miễn phí, kể cả khi bạn chỉ đặt 1 cái — không có mức đơn tối thiểu. Các tỉnh thành khác giao toàn quốc, phí giao chúng tôi báo cụ thể khi xác nhận đơn.',
  },
];

export default function ContactPage() {
  return (
    <>
      <section className="page-hero">
        <div className="hero-glow" aria-hidden="true" />
        <div className="container">
          <Reveal as="p" className="kicker">Liên hệ</Reveal>
          <Reveal as="h1">Chỉ cần tên và địa chỉ quán của bạn</Reveal>
          <Reveal as="p" className="page-hero-sub">
            Gọi cho chúng tôi — tư vấn chọn bảng hay standee và giao tận nơi.
            Bạn chỉ việc đặt lên quầy. Đặt từ 2 cái được giá tốt hơn.
          </Reveal>
        </div>
      </section>

      <section className="section contact" id="lien-he">
        <div className="container">
          <div className="contact-grid">
            {/* Cả thẻ là một link gọi — số điện thoại là hành động chính của trang,
                nên để cỡ chữ lớn nhất và bấm được ở bất cứ đâu trong thẻ. */}
            <Reveal as="div">
              <a className="contact-call" href={siteConfig.phoneHref}>
                <div className="contact-glow" aria-hidden="true" />
                <span className="contact-call-label">
                  <PhoneIcon className="i" />
                  Gọi hoặc nhắn Zalo
                </span>
                <span className="contact-call-number">{siteConfig.phoneDisplay}</span>
                <span className="contact-call-cta">Bấm để gọi ngay</span>
                <span className="contact-call-note">
                  Trả lời trong vòng 2 phút · Freeship Hà Nội · Giao hàng toàn quốc
                </span>
              </a>
            </Reveal>

            <Reveal as="ol" className="contact-steps" delay={80}>
              <li>
                <span className="contact-step-num" aria-hidden="true">1</span>
                <h3>Cho chúng tôi tên &amp; địa chỉ quán</h3>
                <p>Chỉ vậy thôi — chúng tôi tự tìm trang đánh giá của quán bạn.</p>
              </li>
              <li>
                <span className="contact-step-num" aria-hidden="true">2</span>
                <h3>Duyệt mẫu thiết kế</h3>
                <p>Chúng tôi lên mẫu theo logo &amp; màu thương hiệu, bạn xem rồi duyệt.</p>
              </li>
              <li>
                <span className="contact-step-num" aria-hidden="true">3</span>
                <h3>Nhận hàng, đặt lên quầy</h3>
                <p>Giao tận nơi toàn quốc, miễn phí tại Hà Nội. Cài sẵn rồi, không phải thiết lập gì thêm.</p>
              </li>
            </Reveal>
          </div>

          <Reveal as="p" className="products-note">
            {siteConfig.quantityPricing} Chưa chắc nên chọn bảng NFC hay standee? <Link href="/#san-pham">Xem lại sản phẩm</Link>.
          </Reveal>
        </div>
      </section>

      {/* FAQ vốn đã có sẵn trong dữ liệu SEO của trang này nhưng chưa hiển thị cho
          khách — đưa ra luôn để khách đọc được, đồng thời khớp với JSON-LD bên dưới. */}
      <section className="section section-alt" id="faq">
        <div className="container">
          <Reveal as="header" className="section-head">
            <p className="kicker">Câu hỏi thường gặp</p>
            <h2>Còn thắc mắc gì trước khi gọi?</h2>
          </Reveal>
          <Reveal as="div">
            <FaqAccordion items={faqs} />
          </Reveal>
        </div>
      </section>

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            { ...localBusinessSchema, contactPoint: contactPointSchema },
            breadcrumbSchema([
              { name: 'Trang chủ', href: '/' },
              { name: 'Liên hệ đặt hàng', href: '/lien-he' },
            ]),
            faqSchema(faqs),
          ],
        }}
      />
    </>
  );
}
