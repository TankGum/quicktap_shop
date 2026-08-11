'use client';

// Lưới ảnh "Thiết kế riêng" + popup xem chi tiết (ảnh phóng to, next/prev, đóng bằng
// Esc/bấm ra ngoài). Nhận `designs` từ app/page.js (Server Component) giống cách
// FaqAccordion nhận `items` — dữ liệu đã lấy sẵn từ Airtable ở server, component này
// chỉ lo phần tương tác trên trình duyệt. Cơ chế popup nằm ở Lightbox.jsx (dùng chung với
// VariantGallery.jsx ở trang chi tiết mẫu).

import { useCallback, useRef, useState } from 'react';
import Reveal from './Reveal';
import ProgressiveImg from './ProgressiveImg';
import Lightbox from './Lightbox';

export default function CustomDesignsGallery({ designs }) {
  const [openIndex, setOpenIndex] = useState(null);
  const triggerRefs = useRef([]);
  const lastTriggerRef = useRef(null);

  const count = designs.length;

  const close = useCallback(() => setOpenIndex(null), []);
  const prev = useCallback(() => setOpenIndex((i) => (i - 1 + count) % count), [count]);
  const next = useCallback(() => setOpenIndex((i) => (i + 1) % count), [count]);

  function openAt(i) {
    lastTriggerRef.current = triggerRefs.current[i] || null;
    setOpenIndex(i);
  }

  if (count === 0) return null;

  return (
    <>
      <ul className="custom-grid">
        {designs.map((d, i) => (
          <Reveal as="li" className="custom-item" key={d.id} delay={(i % 3) * 60}>
            <button
              type="button"
              className="custom-item-btn"
              onClick={() => openAt(i)}
              ref={(el) => { triggerRefs.current[i] = el; }}
              aria-haspopup="dialog"
            >
              <ProgressiveImg src={d.image} alt={d.alt} />
            </button>
          </Reveal>
        ))}
      </ul>

      <Lightbox
        items={designs.map((d) => ({ key: d.id, src: d.image, alt: d.alt }))}
        index={openIndex}
        onClose={close}
        onPrev={prev}
        onNext={next}
        returnFocusRef={lastTriggerRef}
      />
    </>
  );
}
