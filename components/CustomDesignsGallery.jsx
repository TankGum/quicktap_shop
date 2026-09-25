'use client';

// Gallery "Thiết kế riêng": lưới ảnh tĩnh + popup xem chi tiết (ảnh phóng to, next/prev, đóng
// bằng Esc/bấm ra ngoài). Nhận `designs` từ app/page.js (Server Component) giống cách
// FaqAccordion nhận `items` — dữ liệu đã lấy sẵn từ Airtable ở server, component này chỉ lo
// phần tương tác trên trình duyệt. Cơ chế popup nằm ở Lightbox.jsx (dùng chung với
// VariantGallery.jsx ở trang chi tiết mẫu).
//
// Trước đây là dải ảnh tự trôi ngang (marquee). Đổi sang lưới đứng yên: khách thấy trọn mọi
// mẫu cùng lúc, không phải chờ ảnh trôi tới hay nhắm bấm vào một ảnh đang chạy. Bố cục lưới
// xem .custom-gallery trong app/globals.css.

import { useCallback, useRef, useState } from 'react';
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
      <ul className="custom-gallery">
        {designs.map((d, i) => (
          <li className="custom-item" key={d.id}>
            <button
              type="button"
              className="custom-item-btn"
              onClick={() => openAt(i)}
              ref={(el) => { triggerRefs.current[i] = el; }}
              aria-haspopup="dialog"
            >
              {/* Ảnh mẫu có đủ tỉ lệ (phần lớn dọc 3:4, có tấm rất cao, có tấm ghép ngang 3:2)
                  nên KHÔNG cắt cho vừa khung: ảnh chính hiện trọn (contain), khoảng dư quanh nó
                  lấp bằng chính ảnh đó phóng to làm mờ. Lớp mờ chỉ cần bản nhỏ nhất (sizes 160px
                  → biến thể w_320 vài KB). */}
              <span className="custom-item-media">
                <ProgressiveImg src={d.image} className="custom-item-backdrop" sizes="160px" />
                <ProgressiveImg
                  src={d.image}
                  alt={d.alt}
                  className="custom-item-img"
                  sizes="(min-width: 1000px) 270px, (min-width: 700px) 33vw, 50vw"
                />
              </span>
              {/* Cột Alt trên Airtable chính là tên quán — hiện luôn làm chú thích, vừa để khách
                  biết mẫu của ai, vừa là "đã có quán thật dùng". */}
              {d.alt && <span className="custom-item-name">{d.alt}</span>}
            </button>
          </li>
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
