import Link from 'next/link';
import Reveal from '@/components/Reveal';
import JsonLd from '@/components/JsonLd';
import ProductVariants from '@/components/ProductVariants';
import ProgressiveImg from '@/components/ProgressiveImg';
import { NfcPlateArt } from '@/components/illustrations';
import { siteConfig } from '@/lib/siteConfig';
import { getProduct } from '@/data/products';
import { getVariantsByProduct } from '@/lib/airtable';
import { TapIcon, RedirectIcon, StarBigIcon } from '@/components/icons';

export const metadata = {
  title: 'Bảng NFC 10x10cm',
  description:
    'Bảng NFC 10x10cm — tích hợp cả chip NFC và mã QR ngay trên mặt bảng, chống nước, mặt sau có keo dán chắc. Dán lên tường, quầy thu ngân hay mặt bàn, khách chạm điện thoại hoặc quét QR là mở thẳng trang đánh giá Google Maps, Booking.com, TripAdvisor.',
  alternates: { canonical: '/san-pham/bang-nfc' },
  openGraph: {
    url: '/san-pham/bang-nfc',
    title: 'Bảng NFC 10x10cm — QuickTapReview',
    description: 'Bảng NFC 10x10cm (chip NFC + mã QR), chống nước, in logo quán. Khách chạm hoặc quét là mở thẳng trang đánh giá.',
  },
  twitter: {
    title: 'Bảng NFC 10x10cm — QuickTapReview',
    description: 'Bảng NFC 10x10cm (chip NFC + mã QR), chống nước, in logo quán. Khách chạm hoặc quét là mở thẳng trang đánh giá.',
  },
};

const product = getProduct('bang-nfc');

const faqs = [
  {
    q: 'Bảng NFC có hoạt động qua ốp lưng điện thoại không?',
    a: 'Hầu hết ốp lưng thường không cản NFC. Với ốp quá dày hoặc có tấm chống từ, khách chỉ cần bỏ ốp ra hoặc quét mã QR in sẵn ngay trên bảng thay thế.',
  },
  {
    q: 'Bảng dán có bị bung khi lau chùi thường xuyên không?',
    a: 'Keo mặt sau được chọn để dính chắc trên tường, quầy, mặt bàn hay kính nhưng vẫn dễ bóc ra khi cần thay vị trí.',
  },
  {
    q: 'Đổi link đánh giá sau này có phải làm bảng mới không?',
    a: 'Không cần. Chúng tôi trỏ lại đích đến cho bạn, chiếc bảng đang dán tại quán vẫn dùng bình thường.',
  },
];

export default async function NfcPlatePage() {
  const airtableVariants = await getVariantsByProduct();
  const variants = [...product.variants, ...(airtableVariants['bang-nfc'] || [])];
  const heroImage = variants.find((v) => v.image)?.image;

  return (
    <>
      <section className="page-hero">
        <div className="hero-glow" aria-hidden="true" />
        <div className="container">
          <Reveal as="p" className="kicker">Sản phẩm · Dạng 1</Reveal>
          <Reveal as="h1">Bảng NFC 10x10cm</Reveal>
          <Reveal as="p" className="page-hero-sub">
            Bảng vuông 10x10cm, có cả chip NFC lẫn mã QR, dán ở đâu khách cũng thấy. Chạm điện thoại hoặc quét mã là mở thẳng trang đánh giá của quán.
          </Reveal>
        </div>
      </section>

      <section className="section" id="bang-nfc">
        <div className="container">
          <Reveal as="article" className="card product">
            <div className="product-media">
              {heroImage ? (
                <ProgressiveImg src={heroImage} alt={product.artLabel} />
              ) : (
                <NfcPlateArt aria-label={product.artLabel} />
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
                <Link className="btn btn-primary" href="/lien-he">Đặt bảng NFC</Link>
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
            <p className="section-sub">Khách không cần biết NFC là gì. Chỉ cần chạm hoặc quét.</p>
          </Reveal>

          <ol className="grid grid-3 steps">
            <Reveal as="li" className="card step" delay={0}>
              <span className="step-num" aria-hidden="true">1</span>
              <span className="step-art" aria-hidden="true"><TapIcon /></span>
              <h3>Khách chạm hoặc quét bảng</h3>
              <p>Đưa điện thoại lại gần bảng NFC dán trên tường hay quầy, hoặc mở camera quét mã QR trên bảng. Không cần mở app nào trước.</p>
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
