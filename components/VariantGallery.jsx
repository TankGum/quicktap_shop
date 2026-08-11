'use client';

// Ảnh lớn + dải thumbnail bên dưới cho trang chi tiết 1 mẫu — bấm thumbnail để đổi ảnh lớn,
// bấm vào ảnh lớn để mở popup xem phóng to (có next/prev nếu nhiều hơn 1 ảnh). Chỉ hiện dải
// thumbnail khi có từ 2 ảnh trở lên; mẫu chỉ 1 ảnh thì layout y hệt trước đây, chỉ thêm được
// bấm để zoom. Xem getVariantsByProduct trong lib/airtable.js (field `images`).

import { useRef, useState } from 'react';
import ProgressiveImg from './ProgressiveImg';
import Lightbox from './Lightbox';

export default function VariantGallery({ images, alt, fallback }) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const mainBtnRef = useRef(null);

  const count = images.length;

  // `fallback` là JSX đã render sẵn (vd <FallbackArt aria-label={...} />) từ component cha —
  // KHÔNG nhận component/hàm ở đây: VariantDetail.jsx là Server Component, VariantGallery là
  // Client Component, Next.js không cho truyền function/component qua ranh giới đó, chỉ được
  // truyền JSX đã render (children) hoặc dữ liệu tuần tự hoá được.
  if (count === 0) {
    return fallback ? <div className="variant-detail-image">{fallback}</div> : null;
  }

  const prev = () => setActive((i) => (i - 1 + count) % count);
  const next = () => setActive((i) => (i + 1) % count);

  return (
    <>
      <div className="variant-detail-image">
        <button
          type="button"
          className="variant-image-btn"
          onClick={() => setLightboxOpen(true)}
          ref={mainBtnRef}
          aria-haspopup="dialog"
          aria-label={`Xem ảnh lớn${alt ? ` — ${alt}` : ''}`}
        >
          {/* key theo src: đổi ảnh thì ProgressiveImg gắn lại từ đầu, hiệu ứng hiện dần chạy
              lại đúng cho từng ảnh thay vì giữ trạng thái "đã tải" của ảnh trước đó. */}
          <ProgressiveImg key={images[active]} src={images[active]} alt={alt} loading="eager" />
        </button>
      </div>

      {count > 1 && (
        <ul className="variant-thumbs">
          {images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                className={`variant-thumb${i === active ? ' is-active' : ''}`}
                onClick={() => setActive(i)}
                aria-current={i === active ? 'true' : undefined}
                aria-label={`Ảnh ${i + 1}/${count}`}
              >
                <ProgressiveImg src={src} alt="" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Lightbox
        items={images.map((src, i) => ({ key: src, src, alt: `${alt}${count > 1 ? ` — ảnh ${i + 1}/${count}` : ''}` }))}
        index={lightboxOpen ? active : null}
        onClose={() => setLightboxOpen(false)}
        onPrev={prev}
        onNext={next}
        returnFocusRef={mainBtnRef}
      />
    </>
  );
}
