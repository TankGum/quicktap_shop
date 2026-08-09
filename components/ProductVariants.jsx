// Danh sách các mẫu thật (ảnh + tên + giá) của một sản phẩm. Mỗi mẫu bấm vào mới sang
// trang chi tiết riêng — mô tả đầy đủ và video (nếu có) chỉ hiện ở đó, không phát ngay ở đây.
// Nếu chưa có mẫu nào, component không render gì cả — an toàn để bỏ trống.

import Link from 'next/link';
import ProgressiveImg from '@/components/ProgressiveImg';

export default function ProductVariants({ variants, title = 'Các mẫu có sẵn' }) {
  if (!variants || variants.length === 0) return null;

  return (
    <div className="variant-gallery">
      <p className="kicker">{title}</p>
      <ul className="variant-grid">
        {variants.map((v) => {
          const media = (
            <div className="variant-media">
              {v.image ? (
                <ProgressiveImg src={v.image} alt={v.name || ''} />
              ) : (
                <span className="variant-media-empty" aria-hidden="true" />
              )}
              {v.video && <span className="variant-video-badge">▶ Có video</span>}
            </div>
          );
          const info = (
            <div className="variant-info">
              {v.name && <strong className="variant-name">{v.name}</strong>}
              {v.price && <span className="variant-price">{v.price}</span>}
            </div>
          );

          return (
            <li className="variant-card" key={v.id || v.name}>
              {v.href ? (
                <Link href={v.href} className="variant-card-link">
                  {media}
                  {info}
                </Link>
              ) : (
                <>
                  {media}
                  {info}
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
