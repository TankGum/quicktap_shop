'use client';

// Popup xem ảnh phóng to dùng chung — tách ra từ CustomDesignsGallery.jsx để dùng lại ở cả
// VariantGallery.jsx (trang chi tiết mẫu) thay vì chép lại nguyên khối focus-trap/bàn phím.
// Component "điều khiển từ ngoài" (controlled): cha giữ state index đang mở, Lightbox chỉ lo
// phần cơ chế modal (khoá cuộn, bẫy Tab, Esc, mũi tên trái/phải, trả focus lúc đóng).
//
// `items`: mảng {key, src, alt}. `index`: số đang mở, hoặc null/undefined nếu đang đóng.
// `returnFocusRef`: ref trỏ tới phần tử cần trả focus về sau khi đóng (nút/ảnh vừa bấm mở).

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import ProgressiveImg from './ProgressiveImg';
import { CloseIcon, ArrowRightIcon } from './icons';

export default function Lightbox({ items, index, onClose, onPrev, onNext, returnFocusRef }) {
  const dialogRef = useRef(null);
  const isOpen = index !== null && index !== undefined;
  const count = items.length;

  // Khoá cuộn nền lúc mở + đưa focus vào dialog; lúc đóng thì trả cuộn lại và trả focus về
  // đúng phần tử đã mở nó — không thì người dùng bàn phím sẽ "lạc" vị trí trên trang.
  useEffect(() => {
    if (!isOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    // Chốt phần tử cần trả focus ngay lúc mở — returnFocusRef trỏ tới nút của ẢNH ĐANG MỞ,
    // đến lúc cleanup chạy (đóng popup) ref có thể đã trỏ sang phần tử khác (vd bấm next/prev
    // rồi mới đóng, VariantGallery đổi `active` khiến ref bên ngoài cập nhật lại).
    const elementToRefocus = returnFocusRef?.current;

    return () => {
      document.body.style.overflow = prevOverflow;
      elementToRefocus?.focus();
    };
  }, [isOpen, returnFocusRef]);

  // Esc đóng, mũi tên trái/phải chuyển ảnh, Tab bị nhốt trong dialog (focus trap) — đây là
  // modal nên Tab lọt ra ngoài sẽ khiến người dùng bàn phím rơi vào nội dung phía sau.
  useEffect(() => {
    if (!isOpen) return undefined;

    function onKeyDown(e) {
      if (e.key === 'Escape') { onClose(); return; }
      if (count > 1 && e.key === 'ArrowLeft') { onPrev(); return; }
      if (count > 1 && e.key === 'ArrowRight') { onNext(); return; }
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
  }, [isOpen, count, onClose, onPrev, onNext]);

  if (!isOpen) return null;

  const current = items[index];

  // Gắn thẳng vào document.body bằng Portal — không render tại chỗ trong cây component.
  // Lý do: `position: fixed` chỉ neo đúng theo viewport nếu KHÔNG có ancestor nào tạo
  // "containing block" mới (transform khác none, filter, contain, hoặc — dễ bị bỏ sót nhất —
  // will-change: transform dù giá trị transform thật sự đang là "none"). Site này bọc nội
  // dung bằng <Reveal> ở khắp nơi, và .reveal có will-change: opacity, transform cho hiệu ứng
  // cuộn — bất kỳ Lightbox nào vô tình render bên trong 1 .reveal sẽ bị "nhốt" trong khung của
  // ancestor đó thay vì phủ hết màn hình thật (đã xảy ra với VariantGallery, không xảy ra với
  // CustomDesignsGallery chỉ vì tình cờ chỗ gọi nó không nằm trong .reveal nào — tức là bug
  // luôn chực chờ tái phát ở bất kỳ chỗ dùng mới nào nếu không sửa tận gốc bằng Portal).
  // An toàn với SSR/output:export: nhánh này chỉ chạy được khi isOpen=true, mà isOpen chỉ có
  // thể true sau một cú click thật của người dùng — nghĩa là luôn ở phía client, document
  // chắc chắn tồn tại, không cần thêm state "mounted" để né lỗi "document is not defined" lúc
  // build tĩnh phía server.
  return createPortal(
    <div className="lightbox-backdrop" onClick={onClose}>
      <div
        className="lightbox"
        role="dialog"
        aria-modal="true"
        aria-label={current.alt || 'Xem ảnh'}
        ref={dialogRef}
        tabIndex={-1}
        // KHÔNG chặn propagation ở đây: .lightbox giờ phủ trọn 100%x100% backdrop (để căn giữa
        // ảnh full màn hình), nên nếu chặn ở cấp này thì mọi điểm bấm — kể cả khoảng trống
        // quanh ảnh — đều không bao giờ chạm tới .lightbox-backdrop để đóng được nữa. Thay vào
        // đó chặn đúng ở ảnh (.lightbox-figure) và từng nút — khoảng trống còn lại tự nổi bọt
        // lên backdrop và đóng, đúng như hành vi "bấm ra ngoài để đóng" mong muốn.
      >
        <button
          type="button"
          className="lightbox-close"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          aria-label="Đóng"
        >
          <CloseIcon />
        </button>

        {count > 1 && (
          <button
            type="button"
            className="lightbox-nav lightbox-prev"
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            aria-label="Ảnh trước"
          >
            <ArrowRightIcon />
          </button>
        )}

        <figure className="lightbox-figure" onClick={(e) => e.stopPropagation()}>
          {/* key theo item.key: ép ProgressiveImg gắn lại từ đầu mỗi khi đổi ảnh, để hiệu ứng
              hiện dần chạy lại đúng cho từng ảnh thay vì giữ trạng thái "đã tải" của ảnh trước. */}
          <ProgressiveImg
            key={current.key}
            src={current.src}
            alt={current.alt || ''}
            loading="eager"
            className="lightbox-img"
          />
          {current.alt && <figcaption className="lightbox-caption">{current.alt}</figcaption>}
        </figure>

        {count > 1 && (
          <button
            type="button"
            className="lightbox-nav lightbox-next"
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            aria-label="Ảnh sau"
          >
            <ArrowRightIcon />
          </button>
        )}

        {count > 1 && (
          <p className="lightbox-counter">{index + 1} / {count}</p>
        )}
      </div>
    </div>,
    document.body,
  );
}
