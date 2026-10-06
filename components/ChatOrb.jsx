'use client';

// "Tapi" — linh vật của khung chat: một quả cầu bóng loáng xanh dương có hai mắt (lấy cảm hứng
// từ kiểu "blue bubble chatbot icon" và quả cầu có vòng quỹ đạo). Vẽ hoàn toàn bằng CSS (xem
// .chat-orb trong globals.css) nên không tải ảnh nào, và mọi kích thước tính theo `em` — chỉ
// cần đổi `size` là cả quả cầu co giãn đúng tỉ lệ.
//
// Hai loại trạng thái, tách bạch:
// - `mood` (prop, do ChatWidget quyết định theo cuộc trò chuyện): idle | listening | thinking |
//   talking | happy. Đổi ít, nên đi qua React bình thường.
// - Phản xạ tức thời (nhìn theo con trỏ, nảy khi click, lắc khi cuộn, bị chọc, ngủ gật): do
//   useOrbReactions() bên dưới ghi THẲNG lên DOM (biến CSS + class) — chúng bắn hàng chục lần
//   mỗi giây, đi qua setState thì cả khung chat render lại liên tục vô ích.

import { forwardRef, useEffect } from 'react';

const ChatOrb = forwardRef(function ChatOrb({ size = 56, mood = 'idle', className = '' }, ref) {
  return (
    <span
      ref={ref}
      data-orb=""
      className={`chat-orb mood-${mood}${className ? ` ${className}` : ''}`}
      style={{ '--orb': `${size}px` }}
      aria-hidden="true"
    >
      <span className="chat-orb-ring" />
      <span className="chat-orb-float">
        <span className="chat-orb-body">
          <span className="chat-orb-face">
            <i className="chat-orb-eye" />
            <i className="chat-orb-eye" />
            <i className="chat-orb-mouth" />
          </span>
          <span className="chat-orb-shine" />
        </span>
      </span>
      <span className="chat-orb-zzz">z</span>
    </span>
  );
});

export default ChatOrb;

// Chạy lại một animation CSS kể cả khi class đó đang còn trên phần tử: gỡ class, ép trình
// duyệt tính lại layout (đọc offsetWidth), rồi gắn lại — không có bước giữa thì gắn lại một
// class đang có sẵn là không có gì xảy ra.
function replay(el, cls, ms) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
  clearTimeout(el[`_t_${cls}`]);
  el[`_t_${cls}`] = setTimeout(() => el.classList.remove(cls), ms);
}

const SLEEP_AFTER_MS = 30000;

/**
 * Gắn các phản xạ của Tapi vào toàn trang. Gọi MỘT lần (trong ChatWidget); tác động lên mọi
 * quả cầu đang có trên trang qua [data-orb].
 */
export function useOrbReactions() {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    // Máy bật "giảm chuyển động": không nhìn theo, không nảy, không lắc. Tapi vẫn chớp mắt /
    // đổi nét mặt theo cuộc trò chuyện (khối @media đầu globals.css đã dừng các animation).
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    const orbs = () => document.querySelectorAll('[data-orb]');
    const finePointer = window.matchMedia?.('(pointer: fine)').matches;

    // Đặt hướng nhìn cho từng quả cầu theo một điểm trên màn hình: vector từ tâm quả cầu tới
    // điểm đó, chia cho ~320px rồi chặn trong [-1, 1].
    // ĐỌC hết vị trí các quả cầu trước, rồi mới GHI biến CSS. Đọc–ghi xen kẽ từng quả (đọc
    // rect quả 1, ghi style quả 1, đọc rect quả 2…) ép trình duyệt tính lại bố cục giữa chừng
    // mỗi lần chuột nhích — chiếm luồng chính, làm giật các hiệu ứng khác đang chạy trên trang
    // (vd. mũi tên "Sản phẩm" trên header xoay khi rê chuột).
    const lookAt = (x, y) => {
      const list = [...orbs()].map((el) => [el, el.getBoundingClientRect()]);
      for (const [el, r] of list) {
        if (!r.width) continue; // quả cầu đang ẩn (khung chat đóng)
        const dx = (x - (r.left + r.width / 2)) / 320;
        const dy = (y - (r.top + r.height / 2)) / 320;
        el.style.setProperty('--lx', Math.max(-1, Math.min(1, dx)).toFixed(3));
        el.style.setProperty('--ly', Math.max(-1, Math.min(1, dy)).toFixed(3));
      }
    };
    const lookHome = () => orbs().forEach((el) => {
      el.style.setProperty('--lx', '0');
      el.style.setProperty('--ly', '0');
    });

    // Ngủ gật sau một lúc không ai đụng tới trang; mọi tương tác đánh thức.
    let sleepTimer;
    const wake = () => {
      orbs().forEach((el) => el.classList.remove('is-sleepy'));
      clearTimeout(sleepTimer);
      sleepTimer = setTimeout(() => orbs().forEach((el) => el.classList.add('is-sleepy')), SLEEP_AFTER_MS);
    };
    wake();

    // Con trỏ chuột: mắt dõi theo, gộp vào một khung hình (rAF) cho nhẹ.
    let raf = 0;
    let px = 0;
    let py = 0;
    const onMove = (e) => {
      if (e.pointerType !== 'mouse') return;
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; lookAt(px, py); });
      wake();
    };

    // Click / chạm: chọc trúng quả cầu thì nó bị bóp dẹt rồi cười; chạm chỗ khác trên trang
    // thì nó nảy lên và liếc về phía đó.
    let homeTimer;
    const onDown = (e) => {
      wake();
      const hit = e.target instanceof Element ? e.target.closest('[data-orb], .chat-fab') : null;
      const hitOrb = hit && (hit.matches('[data-orb]') ? hit : hit.querySelector('[data-orb]'));
      if (hitOrb) {
        replay(hitOrb, 'is-poke', 900);
        return;
      }
      lookAt(e.clientX, e.clientY);
      orbs().forEach((el) => replay(el, 'is-hop', 600));
      // Điện thoại không có con trỏ để dõi theo — nhìn một lúc rồi quay về giữa.
      if (!finePointer) {
        clearTimeout(homeTimer);
        homeTimer = setTimeout(lookHome, 1400);
      }
    };

    // Cuộn: lắc như thạch, mắt liếc theo chiều cuộn (cuộn xuống thì nhìn xuống). Dừng cuộn
    // ~220ms thì mắt về lại chỗ cũ.
    let lastY = window.scrollY;
    let scrollTimer;
    let wobbling = false;
    const onScroll = () => {
      const y = window.scrollY;
      const dir = y > lastY ? 1 : -1;
      lastY = y;
      orbs().forEach((el) => {
        el.style.setProperty('--ly', String(dir * 0.9));
        if (!wobbling) replay(el, 'is-scroll', 650);
      });
      wobbling = true;
      wake();
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        wobbling = false;
        if (!finePointer) lookHome();
        else lookAt(px, py);
      }, 220);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('keydown', wake);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', wake);
      cancelAnimationFrame(raf);
      clearTimeout(sleepTimer);
      clearTimeout(scrollTimer);
      clearTimeout(homeTimer);
    };
  }, []);
}

/** Cho quả cầu "chào" một cái (dùng khi vừa mở khung chat). */
export function greetOrb(el) {
  if (el) replay(el, 'is-poke', 900);
}
