import Link from 'next/link';
import Reveal from '@/components/Reveal';
import JsonLd from '@/components/JsonLd';
import ProductVariants from '@/components/ProductVariants';
import { getProduct } from '@/data/products';
import { getVariantsByProduct } from '@/lib/airtable';
import { TapIcon, RedirectIcon, StarBigIcon } from '@/components/icons';
import { localBusinessSchema, faqSchema, breadcrumbSchema, ORG_ID } from '@/lib/schema';

// "A6" là khổ giấy, không phải từ khoá — khách tìm "standee QR review Google Maps" hoặc
// "standee đánh giá google map để bàn". Khổ giấy lùi xuống mô tả (xem ghi chú cùng loại ở
// trang bảng NFC).
const ogTitle = 'Standee QR review Google Maps để bàn';
const ogDescription =
  'Standee để bàn QR + NFC, đứng vững trên quầy thu ngân. Khách quét hoặc chạm là mở thẳng trang đánh giá Google Maps.';

export const metadata = {
  title: ogTitle,
  description:
    'Standee QR review Google Maps để bàn (khổ A6), tích hợp QR + NFC — đứng vững trên quầy thu ngân, khách quét QR hoặc chạm NFC là mở thẳng trang đánh giá Google Maps, Booking.com, TripAdvisor. In theo logo quán, giao toàn quốc, trong ngày tại Hà Nội.',
  alternates: { canonical: '/san-pham/standee' },
  openGraph: { url: '/san-pham/standee', title: ogTitle, description: ogDescription },
  twitter: { title: ogTitle, description: ogDescription },
};

const product = getProduct('standee');

const faqs = [
  {
    q: 'Standee có bị đổ khi khách va vào không?',
    a: 'Chân đế được thiết kế thấp và rộng, giữ vững trên quầy thu ngân hay mặt bàn. Nếu bị va mạnh xô đổ cũng không vỡ vì chất liệu nhẹ, dễ dựng lại.',
  },
  {
    q: 'Khách cần tới gần mới quét được mã QR không?',
    a: 'Mã QR in rõ nét và tương phản cao, quét thoải mái từ khoảng 30–50 cm bằng camera điện thoại.',
  },
  {
    q: 'Đổi link đánh giá sau này có phải làm standee mới không?',
    a: 'Không cần. Chúng tôi trỏ lại đích đến cho bạn, standee đang đặt trên quầy vẫn dùng bình thường.',
  },
];

export default async function StandeePage() {
  const airtableVariants = await getVariantsByProduct();
  const variants = [...product.variants, ...(airtableVariants.standee || [])];

  return (
    <>
      <section className="page-hero">
        <div className="hero-glow" aria-hidden="true" />
        <div className="container">
          <Reveal as="p" className="kicker">Sản phẩm · Kiểu 2</Reveal>
          <Reveal as="h1">Standee để bàn A6</Reveal>
          <Reveal as="p" className="page-hero-sub">
            Đặt trên quầy thu ngân hay từng bàn. Khách quét mã QR hoặc chạm NFC — đều mở thẳng
            trang đánh giá của quán.
          </Reveal>
        </div>
      </section>

      <section className="section" id="standee">
        <div className="container">
          {/* Vào trang là thấy ngay các mẫu thật. Trước đây chỗ này còn một thẻ giới thiệu
              (ảnh + tên + mô tả + nút đặt hàng) nhưng nó chỉ nhắc lại đúng những gì hero ngay
              trên vừa nói, đẩy lưới mẫu — thứ khách vào đây để xem — xuống dưới màn hình. */}
          <Reveal as="div">
            <ProductVariants variants={variants} />
          </Reveal>

          <Reveal as="p" className="products-note">
            Đặt 1 cái cũng nhận — đặt từ 2 cái được giá tốt hơn.{' '}
            <Link href="/lien-he">Liên hệ để báo giá theo số lượng</Link>.
          </Reveal>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <Reveal as="header" className="section-head">
            <p className="kicker">Cách hoạt động</p>
            <h2>Cũng một trải nghiệm: chạm hoặc quét là xong</h2>
            <p className="section-sub">Khách không cần biết NFC hay QR là gì. Chỉ cần chạm hoặc quét.</p>
          </Reveal>

          <ol className="steps">
            <Reveal as="li" className="card step" delay={0}>
              <span className="step-art" aria-hidden="true"><TapIcon /></span>
              <h3>Khách chạm hoặc quét</h3>
              <p>Đưa điện thoại lại gần vùng NFC, hoặc mở camera quét mã QR trên standee.</p>
            </Reveal>
            <Reveal as="li" className="card step" delay={60}>
              <span className="step-art" aria-hidden="true"><RedirectIcon /></span>
              <h3>Mở thẳng trang đánh giá</h3>
              <p>Điện thoại tự nhảy tới đúng trang viết review của quán bạn — Google Maps, Booking.com, TripAdvisor.</p>
            </Reveal>
            <Reveal as="li" className="card step" delay={120}>
              <span className="step-art" aria-hidden="true"><StarBigIcon /></span>
              <h3>Chấm sao &amp; gửi</h3>
              <p>Khách chọn 5 sao, gõ vài chữ rồi gửi — chưa tới một phút.</p>
            </Reveal>
          </ol>
        </div>
      </section>

      <section className="section cta-band">
        <div className="container">
          <Reveal as="div" className="cta-card">
            <div className="contact-glow" aria-hidden="true" />
            <p className="kicker">Đặt hàng</p>
            <h2>Chọn xong rồi? Gửi tên và địa chỉ cho chúng tôi</h2>
            <p className="contact-sub">
              Chỉ cần tên và địa chỉ, chúng tôi lo phần còn lại và giao tận nơi. Trả lời trong vòng 2 phút.
            </p>
            <div className="cta-band-actions">
              <Link className="btn btn-primary btn-lg" href="/lien-he">Xem thông tin liên hệ</Link>
            </div>
          </Reveal>
        </div>
      </section>

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            localBusinessSchema,
            breadcrumbSchema([
              { name: 'Trang chủ', href: '/' },
              { name: 'Standee QR review Google Maps', href: product.href },
            ]),
            {
              '@type': 'Product',
              name: 'Standee QR review Google Maps để bàn',
              brand: { '@id': ORG_ID },
              description: product.body,
              category: 'Thiết bị marketing tại điểm bán',
            },
            faqSchema(faqs),
          ],
        }}
      />
    </>
  );
}