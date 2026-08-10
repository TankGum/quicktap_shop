'use client';

// Ảnh lớn + dải thumbnail bên dưới cho trang chi tiết 1 mẫu — bấm thumbnail để đổi ảnh lớn.
// Chỉ hiện dải thumbnail khi có từ 2 ảnh trở lên; mẫu chỉ 1 ảnh thì y hệt trước đây, không có
// gì thay đổi về giao diện. Xem getVariantsByProduct trong lib/airtable.js (field `images`).

import { useState } from 'react';
import ProgressiveImg from './ProgressiveImg';

export default function VariantGallery({ images, alt, fallback }) {
  const [active, setActive] = useState(0);

  // `fallback` là JSX đã render sẵn (vd <FallbackArt aria-label={...} />) từ component cha —
  // KHÔNG nhận component/hàm ở đây: VariantDetail.jsx là Server Component, VariantGallery là
  // Client Component, Next.js không cho truyền function/component qua ranh giới đó, chỉ được
  // truyền JSX đã render (children) hoặc dữ liệu tuần tự hoá được.
  if (images.length === 0) {
    return fallback ? <div className="variant-detail-image">{fallback}</div> : null;
  }

  return (
    <>
      <div className="variant-detail-image">
        {/* key theo src: đổi ảnh thì ProgressiveImg gắn lại từ đầu, hiệu ứng hiện dần chạy
            lại đúng cho từng ảnh thay vì giữ trạng thái "đã tải" của ảnh trước đó. */}
        <ProgressiveImg key={images[active]} src={images[active]} alt={alt} loading="eager" />
      </div>

      {images.length > 1 && (
        <ul className="variant-thumbs">
          {images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                className={`variant-thumb${i === active ? ' is-active' : ''}`}
                onClick={() => setActive(i)}
                aria-current={i === active ? 'true' : undefined}
                aria-label={`Ảnh ${i + 1}/${images.length}`}
              >
                <ProgressiveImg src={src} alt="" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
