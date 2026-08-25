'use client';

// Section "xem tại quán thật": lưới ảnh chụp thật của tất cả mẫu đang dùng tại quán.
// Đồng bộ UI với section "Thiết kế riêng" — dùng chung khuôn .custom-grid.

import Link from 'next/link';
import Reveal from './Reveal';
import ProgressiveImg from './ProgressiveImg';

export default function ProductSpotlight({ items, kicker, title, id }) {
  if (items.length === 0) return null;

  return (
    <section className="section" id={id}>
      <div className="container">
        <Reveal as="header" className="section-head">
          <p className="kicker">{kicker}</p>
          <h2>{title}</h2>
        </Reveal>

        <ul className="spotlight-grid">
          {items.map((it, i) => (
            <Reveal as="li" className="spotlight-card" key={it.id} delay={(i % 3) * 60}>
              <Link href={it.href} className="spotlight-card-link">
                <div className="spotlight-card-img">
                  <ProgressiveImg src={it.image} alt={it.name} />
                </div>
                <div className="spotlight-card-body">
                  <span className="spotlight-card-name">{it.name}</span>
                  {it.price && (
                    <span className="spotlight-card-price">{it.price}</span>
                  )}
                </div>
              </Link>
            </Reveal>
          ))}
        </ul>

        <Reveal as="p" className="products-note" delay={80}>
          Chọn mẫu bạn thích{' '}
          <Link href="/lien-he">Liên hệ để đặt hàng</Link>.
        </Reveal>
      </div>
    </section>
  );
}
