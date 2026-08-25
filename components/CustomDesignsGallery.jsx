'use client';

// Dải ảnh "Thiết kế riêng" chạy ngang liên tục + popup xem chi tiết (ảnh phóng to, next/prev,
// đóng bằng Esc/bấm ra ngoài). Nhận `designs` từ app/page.js (Server Component) giống cách
// FaqAccordion nhận `items` — dữ liệu đã lấy sẵn từ Airtable ở server, component này chỉ lo
// phần tương tác trên trình duyệt. Cơ chế popup nằm ở Lightbox.jsx (dùng chung với
// VariantGallery.jsx ở trang chi tiết mẫu).
//
// Dải chạy được là nhờ LẶP LẠI danh sách nhiều lần rồi trượt track sang trái đúng bằng bề
// rộng một lượt: tới lúc hết một lượt thì lượt kế tiếp đã nằm sẵn đúng chỗ đó, nên vòng lặp
// không thấy mối nối. Xem .custom-marquee trong app/globals.css.

import { useCallback, useRef, useState } from 'react';
import ProgressiveImg from './ProgressiveImg';
import Lightbox from './Lightbox';

// Bề rộng một thẻ (xấp xỉ, gồm cả khoảng hở) dùng để ước lượng cần lặp bao nhiêu lượt.
const CARD_PX = 300;
// Track phải dài hơn màn hình rộng nhất, nếu không sẽ hở một mảng trống khi chạy tới cuối.
const MIN_TRACK_PX = 2600;

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

  // Ít mẫu thì phải lặp nhiều lượt hơn mới đủ dài. Tối thiểu 2 lượt vì vòng lặp cần ít nhất
  // một lượt dự trữ nằm sẵn bên phải để trượt vào chỗ lượt vừa đi hết.
  const sets = Math.max(2, Math.ceil(MIN_TRACK_PX / (count * CARD_PX)));
  // Chạy chậm và đều: thêm mẫu thì dải dài ra, thời gian cũng dài ra tương ứng nên tốc độ
  // trượt nhìn vẫn y như cũ.
  const duration = Math.max(24, count * 6);

  return (
    <>
      <div className="custom-marquee">
        <ul
          className="custom-marquee-track"
          style={{ '--sets': sets, '--marquee-duration': `${duration}s` }}
        >
          {Array.from({ length: sets }).flatMap((_, s) =>
            designs.map((d, i) => {
              // Các lượt lặp chỉ là bản sao để vá vòng lặp: giấu khỏi trình đọc màn hình và
              // bỏ khỏi thứ tự tab, nếu không khách bấm Tab sẽ đi qua cùng một ảnh mấy lần.
              // Vẫn cho bấm chuột được — ảnh đang nhìn thấy mà bấm không ăn thì rất khó chịu.
              const isClone = s > 0;
              return (
                <li className="custom-item" key={`${s}-${d.id}`} aria-hidden={isClone || undefined}>
                  <button
                    type="button"
                    className="custom-item-btn"
                    onClick={() => openAt(i)}
                    tabIndex={isClone ? -1 : undefined}
                    ref={isClone ? undefined : (el) => { triggerRefs.current[i] = el; }}
                    aria-haspopup={isClone ? undefined : 'dialog'}
                  >
                    <ProgressiveImg
                      src={d.image}
                      alt={isClone ? '' : d.alt}
                      sizes="(min-width: 760px) 300px, 60vw"
                    />
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>

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
