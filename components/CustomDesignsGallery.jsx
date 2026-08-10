'use client';

// Lưới ảnh "Thiết kế riêng" + popup xem chi tiết (ảnh phóng to, next/prev, đóng bằng
// Esc/bấm ra ngoài). Nhận `designs` từ app/page.js (Server Component) giống cách
// FaqAccordion nhận `items` — dữ liệu đã lấy sẵn từ Airtable ở server, component này
// chỉ lo phần tương tác trên trình duyệt.

import { useCallback, useEffect, useRef, useState } from 'react';
import Reveal from './Reveal';
import ProgressiveImg from './ProgressiveImg';
import { CloseIcon, ArrowRightIcon } from './icons';

export default function CustomDesignsGallery({ designs }) {
  const [openIndex, setOpenIndex] = useState(null);
  const triggerRefs = useRef([]);
  const dialogRef = useRef(null);
  const lastTriggerRef = useRef(null);

  const count = designs.length;
  const isOpen = openIndex !== null;

  const close = useCallback(() => setOpenIndex(null), []);
  const prev = useCallback(() => setOpenIndex((i) => (i - 1 + count) % count), [count]);
  const next = useCallback(() => setOpenIndex((i) => (i + 1) % count), [count]);

  function openAt(i) {
    lastTriggerRef.current = triggerRefs.current[i] || null;
    setOpenIndex(i);
  }

  // Khoá cuộn nền lúc popup mở + đưa focus vào dialog; lúc đóng thì trả cuộn lại và trả
  // focus về đúng ảnh vừa bấm — không thì người dùng bàn phím sẽ "lạc" vị trí trên trang.
  useEffect(() => {
    if (!isOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();

    return () => {
      document.body.style.overflow = prevOverflow;
      lastTriggerRef.current?.focus();
    };
  }, [isOpen]);

  // Esc đóng, mũi tên trái/phải chuyển ảnh, Tab bị nhốt trong dialog (focus trap) — đây là
  // modal nên Tab lọt ra ngoài sẽ khiến người dùng bàn phím rơi vào nội dung phía sau.
  useEffect(() => {
    if (!isOpen) return undefined;

    function onKeyDown(e) {
      if (e.key === 'Escape') { close(); return; }
      if (count > 1 && e.key === 'ArrowLeft') { prev(); return; }
      if (count > 1 && e.key === 'ArrowRight') { next(); return; }
      if (e.key !== 'Tab') return;

      const focusables = Array.from(dialogRef.current?.querySelectorAll('button') || []);
      if (focusables.length === 0) return;
      if (focusables.length === 1) { e.preventDefault(); focusables[0].focus(); return; }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, count, close, prev, next]);

  if (count === 0) return null;

  const current = isOpen ? designs[openIndex] : null;

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

      {isOpen && (
        <div className="lightbox-backdrop" onClick={close}>
          <div
            className="lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={current.alt || 'Xem ảnh thiết kế'}
            ref={dialogRef}
            tabIndex={-1}
            // Chặn click nổi bọt lên backdrop — không thì bấm vào ảnh/nút cũng đóng luôn popup.
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="lightbox-close" onClick={close} aria-label="Đóng">
              <CloseIcon />
            </button>

            {count > 1 && (
              <button type="button" className="lightbox-nav lightbox-prev" onClick={prev} aria-label="Ảnh trước">
                <ArrowRightIcon />
              </button>
            )}

            <figure className="lightbox-figure">
              {/* key={current.id}: ép ProgressiveImg gắn lại từ đầu mỗi khi đổi ảnh, để
                  hiệu ứng hiện dần chạy lại đúng cho từng ảnh thay vì giữ trạng thái "đã tải"
                  của ảnh trước đó. */}
              <ProgressiveImg
                key={current.id}
                src={current.image}
                alt={current.alt}
                loading="eager"
                className="lightbox-img"
              />
              {current.alt && <figcaption className="lightbox-caption">{current.alt}</figcaption>}
            </figure>

            {count > 1 && (
              <button type="button" className="lightbox-nav lightbox-next" onClick={next} aria-label="Ảnh sau">
                <ArrowRightIcon />
              </button>
            )}

            {count > 1 && (
              <p className="lightbox-counter">{openIndex + 1} / {count}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
