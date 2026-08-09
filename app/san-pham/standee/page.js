import Link from 'next/link';
import Reveal from '@/components/Reveal';
import JsonLd from '@/components/JsonLd';
import ProductVariants from '@/components/ProductVariants';
import ProgressiveImg from '@/components/ProgressiveImg';
import { StandeeArt } from '@/components/illustrations';
import { siteConfig } from '@/lib/siteConfig';
import { getProduct } from '@/data/products';
import { getVariantsByProduct } from '@/lib/airtable';
import { TapIcon, RedirectIcon, StarBigIcon } from '@/components/icons';

export const metadata = {
  title: 'Standee để bàn (QR + NFC)',
  description:
    'Standee để bàn tích hợp QR + NFC — đứng vững trên quầy thu ngân, khách quét QR hoặc chạm NFC là mở thẳng trang đánh giá Google Maps, Booking.com, TripAdvisor.',
  alternates: { canonical: '/san-pham/standee' },
  openGraph: {
    url: '/san-pham/standee',
    title: 'Standee để bàn (QR + NFC) — QuickTapReview',
    description: 'Standee để bàn QR + NFC, đứng vững trên quầy. Quét hoặc chạm là mở thẳng trang đánh giá.',
  },
  twitter: {
    title: 'Standee để bàn (QR + NFC) — QuickTapReview',
    description: 'Standee để bàn QR + NFC, đứng vững trên quầy. Quét hoặc chạm là mở thẳng trang đánh giá.',
  },
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
  const heroImage = variants.find((v) => v.image)?.image;

  return (
    <>
      <section className="page-hero">
        <div className="hero-glow" aria-hidden="true" />
        <div className="container">
          <Reveal as="p" className="kicker">Sản phẩm · Dạng 2</Reveal>
          <Reveal as="h1">Standee để bàn (QR + NFC)</Reveal>
          <Reveal as="p" className="page-hero-sub">
            Đặt trên quầy thu ngân hay từng bàn. Khách quét mã QR hoặc chạm NFC — đều mở thẳng
            trang đánh giá của quán.
          </Reveal>
        </div>
      </section>

      <section className="section" id="standee">
        <div className="container">
          <Reveal as="article" className="card product">
            <div className="product-media">
              {heroImage ? (
                <ProgressiveImg src={heroImage} alt={product.artLabel} />
              ) : (
                <StandeeArt aria-label={product.artLabel} />
              )}
            </div>
            <div className="product-body">
              <p className="kicker">{product.kicker}</p>
              <h2 className="product-title">{product.title}</h2>
              <p>{product.body}</p>
              <ul className="ticks">
                {product.ticks.map((t) => <li key={t}>{t}</li>)}
              </ul>
              <div className="product-ctas">
                <Link className="btn btn-primary" href="/lien-he">Đặt standee</Link>
                <Link className="btn btn-ghost" href="/#san-pham">Xem sản phẩm khác</Link>
              </div>
            </div>
          </Reveal>

          <Reveal as="div">
            <ProductVariants variants={variants} />
          </Reveal>

          <Reveal as="p" className="products-note">
            Đặt 1 cái cũng nhận — số lượng lớn cho chuỗi có giá riêng.{' '}
            <a href={siteConfig.phoneHref}>Gọi để báo giá theo số lượng</a>
            {' '}hoặc <Link href="/lien-he">xem đầy đủ thông tin liên hệ</Link>.
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

          <ol className="grid grid-3 steps">
            <Reveal as="li" className="card step" delay={0}>
              <span className="step-num" aria-hidden="true">1</span>
              <span className="step-art" aria-hidden="true"><TapIcon /></span>
              <h3>Khách chạm hoặc quét</h3>
              <p>Đưa điện thoại lại gần vùng NFC, hoặc mở camera quét mã QR trên standee.</p>
            </Reveal>
            <Reveal as="li" className="card step" delay={60}>
              <span className="step-num" aria-hidden="true">2</span>
              <span className="step-art" aria-hidden="true"><RedirectIcon /></span>
              <h3>Mở thẳng trang đánh giá</h3>
              <p>Điện thoại tự nhảy tới đúng trang viết review của quán bạn — Google Maps, Booking.com, TripAdvisor.</p>
            </Reveal>
            <Reveal as="li" className="card step" delay={120}>
              <span className="step-num" aria-hidden="true">3</span>
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
            <h2>Chọn xong rồi? Gửi tên và địa chỉ quán cho chúng tôi</h2>
            <p className="contact-sub">
              Chỉ cần tên và địa chỉ quán, chúng tôi lo phần còn lại và giao tận nơi. Trả lời trong vòng 2 phút.
            </p>
            <div className="cta-band-actions">
              <Link className="btn btn-primary btn-lg" href="/lien-he">Xem thông tin liên hệ</Link>
              <a className="btn btn-outline btn-lg" href={siteConfig.phoneHref}>Gọi ngay</a>
            </div>
          </Reveal>
        </div>
      </section>

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Organization',
              '@id': `${siteConfig.siteUrl}/#org`,
              name: siteConfig.brandName,
              url: `${siteConfig.siteUrl}/`,
              telephone: siteConfig.phoneDisplay,
              areaServed: 'VN',
            },
            {
              '@type': 'Product',
              name: product.title,
              brand: { '@id': `${siteConfig.siteUrl}/#org` },
              description: product.body,
              category: 'Thiết bị marketing tại điểm bán',
            },
            {
              '@type': 'FAQPage',
              mainEntity: faqs.map((f) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
              })),
            },
          ],
        }}
      />
    </>
  );
}