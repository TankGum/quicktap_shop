// Nội dung trang chi tiết 1 mẫu cụ thể (điền từ Airtable).
// Bố cục 2 cột: ảnh + video bên trái, tên/mô tả/giá dính (sticky) bên phải khi cuộn.

import Link from 'next/link';
import Reveal from '@/components/Reveal';
import JsonLd from '@/components/JsonLd';
import VariantGallery from '@/components/VariantGallery';
import { siteConfig } from '@/lib/siteConfig';

export default function VariantDetail({ variant, product, FallbackArt }) {
  const priceNumber = variant.price ? variant.price.replace(/[^\d]/g, '') : '';

  return (
    <>
      <section className="section variant-detail-section">
        <div className="container">
          <Reveal as="p" className="kicker">
            <Link href={product.href} className="variant-back">← {product.title}</Link>
          </Reveal>

          <Reveal as="div" className="variant-detail" id={variant.slug}>
            <div className="variant-detail-media">
              <VariantGallery
                images={variant.images || []}
                alt={variant.name}
                fallback={FallbackArt ? <FallbackArt aria-label={product.artLabel} /> : null}
              />

              {variant.video && (
                <div className="variant-detail-video">
                  <video src={variant.video} controls playsInline preload="metadata" />
                </div>
              )}
            </div>

            <div className="variant-detail-info">
              <p className="kicker">{product.title}</p>
              <h1 className="variant-detail-title">{variant.name}</h1>
              {variant.price && <p className="variant-detail-price">{variant.price}</p>}
              {variant.description && <p className="variant-detail-desc">{variant.description}</p>}

              <div className="product-ctas">
                <Link className="btn btn-primary" href="/lien-he">Đặt mẫu này</Link>
                <Link className="btn btn-ghost" href={product.href}>Xem các mẫu khác</Link>
              </div>
            </div>
          </Reveal>
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
            </div>
          </Reveal>
        </div>
      </section>

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Product',
              name: variant.name,
              description: variant.description || product.body,
              ...(variant.images?.length ? { image: variant.images } : {}),
              brand: { '@id': `${siteConfig.siteUrl}/#org` },
              category: product.title,
              ...(priceNumber
                ? { offers: { '@type': 'Offer', priceCurrency: 'VND', price: priceNumber, availability: 'https://schema.org/InStock' } }
                : {}),
            },
          ],
        }}
      />
    </>
  );
}
