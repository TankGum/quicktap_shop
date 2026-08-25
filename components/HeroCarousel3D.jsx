'use client';

// Sân khấu 3D ở đầu trang chủ: toàn bộ mẫu sản phẩm thật (ảnh từ Airtable) xếp thành một
// VÒNG TRÒN trong không gian 3D, tự xoay chậm liên tục, kéo chuột / vuốt để xoay nhanh.
// Mẫu đang ở phía trước hiện to rõ, mẫu vòng ra sau nghiêng và mờ dần theo góc.
//
// Không dùng model 3D hay thư viện ngoài nào — chỉ là CSS 3D transform (perspective +
// rotateY + translateZ) với một vòng lặp requestAnimationFrame cập nhật góc xoay.
//
// `items` chỉ chứa dữ liệu tuần tự hoá được (id/href/name/price/image) — KHÔNG nhận component
// SVG: đây là Client Component, app/page.js (Server Component) không truyền được function qua
// ranh giới đó. Chưa có mẫu nào thì component trả về null.

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import ProgressiveImg from './ProgressiveImg';

const AUTO_SPEED = 7.2;    // độ/giây khi tự xoay
const DRAG_FACTOR = 0.32;  // 1px kéo ngang = bao nhiêu độ xoay
const FRICTION = 0.93;     // hệ số trớn còn lại mỗi frame sau khi thả tay
const DRAG_THRESHOLD = 6;  // px — kéo quá ngần này thì coi là xoay, không phải bấm vào thẻ

export default function HeroCarousel3D({ items }) {
  const stageRef = useRef(null);
  const ringRef = useRef(null);
  const itemsRef = useRef([]);

  // Giữ trong ref, KHÔNG dùng useState: các giá trị này đổi mỗi frame (60-120 lần/giây),
  // để vào state sẽ ép React render lại từng đó lần cho một hiệu ứng thuần hình ảnh.
  const spinRef = useRef(0);
  const velocityRef = useRef(0);
  const draggingRef = useRef(false);
  const movedRef = useRef(0);
  // Dừng tự xoay khi khách rê chuột vào hoặc tab tới một thẻ: các thẻ này bấm được, vòng cứ
  // xoay tiếp thì nhắm trúng thẻ muốn bấm là chuyện bực mình.
  const pausedRef = useRef(false);

  // Tên mẫu đang ở chính giữa thì phải hiện ra chữ nên buộc phải qua state — nhưng chỉ đổi
  // khi thẻ ở giữa thay đổi (mỗi vài giây một lần), không phải mỗi frame.
  const [active, setActive] = useState(0);
  const [hinted, setHinted] = useState(false);

  const count = items.length;
  const step = count > 0 ? 360 / count : 0;

  // Bán kính vòng tròn tính theo bề rộng thật của thẻ: r = ((w + khoảng hở) / 2) / tan(π/n).
  // Tính bằng JS thay vì hằng số CSS vì bề rộng thẻ co giãn theo màn hình (clamp) và số mẫu
  // trong Airtable có thể thay đổi — cả hai đều làm bán kính "đúng" khác đi.
  useEffect(() => {
    const ring = ringRef.current;
    if (!ring || count === 0) return;

    const layout = () => {
      const first = itemsRef.current[0];
      if (!first) return;
      const w = first.offsetWidth;
      const gap = w * 0.18;
      const r = count > 1 ? (w + gap) / 2 / Math.tan(Math.PI / count) : 0;
      ring.style.setProperty('--ring-r', `${Math.round(r)}px`);
    };

    layout();
    const observer = new ResizeObserver(layout);
    observer.observe(ring);
    return () => observer.disconnect();
  }, [count]);

  // Vòng lặp xoay + cập nhật độ mờ của từng thẻ theo góc.
  useEffect(() => {
    const ring = ringRef.current;
    if (!ring || count === 0) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf;
    let last = performance.now();
    let lastActive = -1;

    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 0.1); // chặn trần: tab ẩn lâu quay lại không nhảy vọt
      last = now;

      if (draggingRef.current) {
        // Đang kéo: góc do chính tay khách quyết định, không cộng thêm gì.
      } else if (Math.abs(velocityRef.current) > 0.01) {
        // Vừa thả tay: trôi tiếp theo trớn rồi tắt dần.
        spinRef.current += velocityRef.current;
        velocityRef.current *= FRICTION;
      } else if (!reduceMotion && !pausedRef.current) {
        spinRef.current += AUTO_SPEED * dt;
      }

      ring.style.setProperty('--spin', `${spinRef.current.toFixed(2)}deg`);

      // Thẻ nào đang quay mặt về phía người xem thì rõ, càng vòng ra sau càng mờ và tối đi.
      let nearest = 0;
      let nearestDelta = Infinity;
      for (let i = 0; i < count; i++) {
        const el = itemsRef.current[i];
        if (!el) continue;
        // Góc hiệu dụng của thẻ so với hướng nhìn, đưa về khoảng [-180, 180].
        const angle = ((i * step + spinRef.current + 180) % 360 + 360) % 360 - 180;
        const facing = (Math.cos((angle * Math.PI) / 180) + 1) / 2; // 1 = ngay trước mặt, 0 = sau lưng
        el.style.opacity = (0.12 + 0.88 * facing * facing).toFixed(3);
        el.style.filter = `brightness(${(0.62 + 0.38 * facing).toFixed(3)})`;

        const delta = Math.abs(angle);
        if (delta < nearestDelta) {
          nearestDelta = delta;
          nearest = i;
        }
      }
      if (nearest !== lastActive) {
        lastActive = nearest;
        setActive(nearest);
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [count, step]);

  // Kéo chuột / vuốt ngón tay để xoay.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || count === 0) return;

    let lastX = 0;

    const onDown = (e) => {
      draggingRef.current = true;
      movedRef.current = 0;
      lastX = e.clientX;
      velocityRef.current = 0;
      stage.setPointerCapture?.(e.pointerId);
      stage.classList.add('is-dragging');
      setHinted(true);
    };

    const onMove = (e) => {
      if (!draggingRef.current) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      movedRef.current += Math.abs(dx);
      spinRef.current += dx * DRAG_FACTOR;
      velocityRef.current = dx * DRAG_FACTOR;
    };

    const onUp = (e) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      stage.releasePointerCapture?.(e.pointerId);
      stage.classList.remove('is-dragging');
    };

    // Kéo xong, trình duyệt vẫn bắn ra 'click' trên thẻ vừa buông tay — chặn lại, nếu không
    // mỗi lần xoay vòng là một lần lỡ tay điều hướng sang trang chi tiết.
    const onClick = (e) => {
      if (movedRef.current > DRAG_THRESHOLD) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const pause = () => { pausedRef.current = true; };
    const resume = () => { pausedRef.current = false; };

    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerup', onUp);
    stage.addEventListener('pointercancel', onUp);
    stage.addEventListener('click', onClick, true);
    stage.addEventListener('pointerenter', pause);
    stage.addEventListener('pointerleave', resume);
    stage.addEventListener('focusin', pause);
    stage.addEventListener('focusout', resume);
    return () => {
      stage.removeEventListener('pointerdown', onDown);
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerup', onUp);
      stage.removeEventListener('pointercancel', onUp);
      stage.removeEventListener('click', onClick, true);
      stage.removeEventListener('pointerenter', pause);
      stage.removeEventListener('pointerleave', resume);
      stage.removeEventListener('focusin', pause);
      stage.removeEventListener('focusout', resume);
    };
  }, [count]);

  if (count === 0) return null;

  const current = items[active];

  return (
    <div className="hero-stage" ref={stageRef}>
      {/* Sóng lan toả kiểu tín hiệu NFC + vệt sáng dưới sàn — thuần trang trí, nằm sau vòng xoay. */}
      <div className="hero-waves" aria-hidden="true">
        <span className="hero-wave" />
        <span className="hero-wave" />
        <span className="hero-wave" />
      </div>
      <div className="hero-floor" aria-hidden="true" />

      <div className="hero-ring" ref={ringRef}>
        {items.map((item, i) => (
          <Link
            key={item.id}
            href={item.href}
            className="hero-ring-item"
            ref={(el) => { itemsRef.current[i] = el; }}
            style={{ '--i': i, '--step': `${step}deg` }}
            draggable={false}
          >
            <span className="hero-ring-media">
              {/* Thẻ rộng tối đa 236px, phối cảnh phóng thẻ trước lên ~1,5 lần nên cần tới ~360px.
                  Khai báo cố định theo px (không phải vw) vì bề rộng thẻ do --card-w quyết định,
                  không co theo bề ngang màn hình. */}
              <ProgressiveImg
                src={item.image}
                alt={item.name}
                loading="eager"
                sizes="(min-width: 900px) 360px, 220px"
                draggable={false}
              />
            </span>
          </Link>
        ))}
      </div>

      {/* Tên + giá của mẫu đang quay ra trước. KHÔNG đặt aria-live: vòng tự xoay vài giây một
          mẫu, trình đọc màn hình sẽ đọc chen tên mẫu mới không ngớt. Tên từng mẫu đã có sẵn
          trong alt của ảnh trong chính thẻ link, đủ để đọc đúng khi tab tới. */}
      <div className="hero-stage-caption" aria-hidden="true">
        <span className="hero-stage-name">{current.name}</span>
        {current.price && <span className="hero-stage-price">{current.price}</span>}
      </div>

      <p className={`hero-stage-hint${hinted ? ' is-hidden' : ''}`} aria-hidden="true">
        Kéo để xoay
      </p>
    </div>
  );
}
