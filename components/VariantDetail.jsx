// Nội dung trang chi tiết 1 mẫu cụ thể (điền từ Airtable).
// Bố cục 2 cột: ảnh + video bên trái, tên/mô tả/giá dính (sticky) bên phải khi cuộn.

import { Fragment } from 'react';
import Link from 'next/link';
import Reveal from '@/components/Reveal';
import JsonLd from '@/components/JsonLd';
import VariantGallery from '@/components/VariantGallery';
import { siteConfig } from '@/lib/siteConfig';
import { toPlainText } from '@/lib/airtable';
import { localBusinessSchema, breadcrumbSchema, ORG_ID } from '@/lib/schema';

// Mô tả trong Airtable có thể chứa <br> (gõ tay để xuống dòng) hoặc xuống dòng thật (Enter
// trong ô Long text) — render thẳng chuỗi thì React tự escape "<br>" thành chữ trần, còn
// xuống dòng thật thì bị HTML gộp thành khoảng trắng theo mặc định. Chuẩn hoá cả 2 kiểu về
// cùng 1 danh sách dòng rồi tự vẽ <br/> thật — không dùng dangerouslySetInnerHTML nên không
// có rủi ro XSS dù dữ liệu đến từ Airtable (không lọc được ai gõ gì vào đó).
function renderMultiline(text) {
  const lines = text
    .replace(/<br\s*\/?>/gi, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line, i) => (
    <Fragment key={i}>
      {line}
      {i < lines.length - 1 && <br />}
    </Fragment>
  ));
}

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
              {variant.description && <p className="variant-detail-desc">{renderMultiline(variant.description)}</p>}

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
            // Phải có mặt ở ĐÂY, không chỉ ở trang chủ: `brand` bên dưới trỏ tới '#org' bằng
            // @id, mà mỗi trang là một tài liệu JSON-LD độc lập — Google không ghép @id giữa
            // các trang. Trước đây trang chi tiết mẫu trỏ tới một thực thể không tồn tại trên
            // chính nó, nên trường `brand` coi như không có.
            localBusinessSchema,
            breadcrumbSchema([
              { name: 'Trang chủ', href: '/' },
              { name: product.title, href: product.href },
              { name: variant.name, href: variant.href },
            ]),
            {
              '@type': 'Product',
              name: variant.name,
              description: variant.description ? toPlainText(variant.description) : product.body,
              ...(variant.images?.length ? { image: variant.images } : {}),
              brand: { '@id': ORG_ID },
              category: product.title,
              ...(priceNumber
                ? {
                    offers: {
                      '@type': 'Offer',
                      priceCurrency: 'VND',
                      price: priceNumber,
                      availability: 'https://schema.org/InStock',
                      // Google bỏ qua cả khối Offer nếu thiếu url — không có nó thì giá không
                      // bao giờ hiện kèm kết quả tìm kiếm, tức mất đúng phần đáng giá nhất.
                      url: `${siteConfig.siteUrl}${variant.href}`,
                      // Khai phí vận chuyển = 0 và GIỚI HẠN đúng ở Hà Nội bằng addressRegion.
                      // Nhờ vậy Google được phép hiện nhãn "Miễn phí vận chuyển" cho người
                      // tìm ở Hà Nội mà không hứa nhầm với khách tỉnh khác — nơi phí vẫn báo
                      // lúc xác nhận đơn (xem siteConfig.shippingPolicy).
                      shippingDetails: {
                        '@type': 'OfferShippingDetails',
                        shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: 'VND' },
                        shippingDestination: {
                          '@type': 'DefinedRegion',
                          addressCountry: 'VN',
                          addressRegion: siteConfig.shippingFreeRegion,
                        },
                      },
                    },
                  }
                : {}),
            },
          ],
        }}
      />
    </>
  );
}
