'use client';

// Standee A6 dựng thành khối 3D thật để khách xoay xem trước khi đặt: hai tấm A6 gấp
// chụm ở đỉnh, một tấm đáy trong suốt nối hai chân, mỗi tấm là một hộp 6 mặt có bề dày
// 2mm nên xoay tới cạnh nào cũng thấy độ dày giấy.
//
// Không dùng thư viện 3D nào — chỉ CSS transform (perspective + preserve-3d) với một vòng
// requestAnimationFrame cập nhật góc xoay, giống HeroCarousel3D. Hoạ tiết là ảnh xuất
// thẳng từ file PDF in (xem scripts/standee-assets.py) nên khớp bản in thật.
//
// Hình học chỉ có MỘT bậc tự do: đáy nối liền hai chân nên chọn chiều sâu đáy là góc gấp
// suy ra theo asin(sâu / 2·cao). Đừng đặt hai con số rời nhau — chân sẽ hở khỏi mép đáy.

import { useEffect, useRef, useState } from 'react';

const PW = 105;      // bề ngang tấm A6 (mm)
const PH = 148;      // chiều cao tấm A6 (mm)
const TH = 2;        // độ dày giấy (mm)
const DEPTH = 47;    // chiều sâu mặt đáy (mm) — phải khớp DEPTH_MM trong scripts/standee-assets.py

const FOLD = Math.asin(DEPTH / (2 * PH));           // góc gấp so với phương thẳng đứng
const HEIGHT = PH * Math.cos(FOLD) + TH;            // chiều cao thật khi dựng lên

// Bảng vuông: tấm phẳng 100×100mm, bo góc 8mm, dày 2mm.
const CARD = 100;
const CARD_R = 8;

// [ngẩng, xoay] tính bằng độ. rotateX ÂM là nhìn từ trên xuống.
// `idle` là góc 3/4 lúc mới vào — đẹp hơn nhìn thẳng, và cho thấy ngay đây là khối 3D.
const VIEWS = {
  idle: [-15, -32],
  front: [-8, 0],
  back: [-10, -180],
  base: [-42, 0],
};
// `only` = chỉ hiện với loại hình khối đó. Bảng vuông không có mặt đáy.
const POSES = [
  { id: 'front', label: 'Mặt trước' },
  { id: 'back', label: 'Mặt sau' },
  { id: 'base', label: 'Mặt đáy', only: 'standee' },
];

// Kích thước bao (mm) để tính hệ số thu phóng cho vừa khung.
const BOX = {
  standee: [PW, HEIGHT],
  card: [CARD, CARD],
};

const DRAG_X = 0.38;     // 1px kéo ngang = bao nhiêu độ xoay quanh trục đứng
const DRAG_Y = 0.30;
const FRICTION = 0.93;   // trớn còn lại mỗi frame sau khi thả tay
const AUTO_SPEED = 0.2;  // độ mỗi frame khi tự xoay

export default function Standee3D({ models }) {
  const stageRef = useRef(null);
  const standRef = useRef(null);

  const [active, setActive] = useState(0);
  // Góc nhìn đang chọn: null = khách tự xoay lấy, không ô nào sáng.
  const [pose, setPose] = useState(null);
  const [hinted, setHinted] = useState(false);

  // Đổi mỗi frame nên giữ trong ref: để vào state là ép React render lại 60 lần/giây
  // cho một hiệu ứng thuần hình ảnh.
  const view = useRef({ rx: VIEWS.idle[0], ry: VIEWS.idle[1], vx: 0, vy: 0, fit: 1 });
  const dragRef = useRef({ on: false, id: null, x: 0, y: 0 });
  const autoRef = useRef(true);
  const tweenRef = useRef(null);

  const model = models[active];
  const isCard = model.type === 'card';
  const poses = POSES.filter((p) => !p.only || p.only === model.type);

  // fit() nằm trong effect chạy một lần nên không thấy `model` mới; đọc loại qua ref.
  const typeRef = useRef(model.type);
  const refit = useRef(() => {});

  // ----- đặt lại transform lên DOM -----
  useEffect(() => {
    const stage = stageRef.current;
    const stand = standRef.current;
    if (!stage || !stand) return;

    const apply = () => {
      const v = view.current;
      stand.style.setProperty('--rx', `${v.rx.toFixed(2)}deg`);
      stand.style.setProperty('--ry', `${v.ry.toFixed(2)}deg`);
      stand.style.setProperty('--scale', v.fit.toFixed(3));
    };

    // Khung hình luôn vừa khít khung nhìn: tính hệ số thu phóng từ bề rộng/chiều cao thật
    // của standee (mm) so với ô chứa nó.
    //
    // Khoảng đệm dọc là SỐ PX CỐ ĐỊNH (không phải % chiều cao khung) — chủ đích của việc
    // nới chiều cao khung ở desktop là có khoảng thở quanh sản phẩm, dùng % thì khung càng
    // cao mô hình càng phóng theo, thở vẫn tỉ lệ y hệt như khung thấp.
    const fit = () => {
      const r = stage.getBoundingClientRect();
      if (!r.width) return;
      const mm = 2.6; // px mỗi mm ở tỉ lệ gốc, khớp --mm trong CSS
      // Màn hẹp: chú thích ở góc chiếm chỗ hơn nên đệm ít lại, nếu không standee bị bó quá.
      const padY = r.width < 620 ? 28 : 64;
      const availH = Math.max(0, r.height - padY * 2);
      const [boxW, boxH] = BOX[typeRef.current] || BOX.standee;
      view.current.fit = Math.max(
        0.3,
        Math.min((r.width * 0.72) / (boxW * mm), availH / (boxH * mm)),
      );
      apply();
    };
    refit.current = fit;

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(stage);

    // ----- vòng lặp: chỉ chạy khi khối đang nằm trong khung nhìn -----
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) autoRef.current = false;

    let raf = 0;
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min(64, now - last);
      last = now;
      const v = view.current;
      const tween = tweenRef.current;

      if (tween) {
        const p = Math.min(1, (now - tween.t0) / tween.ms);
        const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        v.rx = tween.rx0 + (tween.rx1 - tween.rx0) * e;
        v.ry = tween.ry0 + (tween.ry1 - tween.ry0) * e;
        if (p >= 1) tweenRef.current = null;
        apply();
      } else if (!dragRef.current.on && (Math.abs(v.vx) > 0.01 || Math.abs(v.vy) > 0.01)) {
        v.ry += (v.vx * dt) / 16;
        v.rx = clampRx(v.rx + (v.vy * dt) / 16);
        v.vx *= FRICTION;
        v.vy *= FRICTION;
        apply();
      } else if (!dragRef.current.on && autoRef.current) {
        v.ry += (AUTO_SPEED * dt) / 16;
        apply();
      }
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    let io;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(
        ([entry]) => (entry.isIntersecting ? start() : stop()),
        { rootMargin: '120px' },
      );
      io.observe(stage);
    } else {
      start();
    }

    return () => {
      stop();
      ro.disconnect();
      if (io) io.disconnect();
    };
  }, []);

  // Đổi mẫu có thể đổi luôn hình khối (standee <-> bảng vuông): tính lại cỡ cho vừa khung,
  // và bỏ tư thế "mặt đáy" nếu mẫu mới không có mặt đó.
  useEffect(() => {
    typeRef.current = model.type;
    refit.current();
    if (model.type === 'card' && pose === 'base') {
      setPose(null);
      tweenRef.current = {
        rx0: view.current.rx, rx1: VIEWS.idle[0],
        ry0: view.current.ry, ry1: VIEWS.idle[1],
        t0: performance.now(), ms: 500,
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model.type]);

  // ----- kéo để xoay -----
  const onPointerDown = (e) => {
    const d = dragRef.current;
    if (d.id !== null) return;
    d.id = e.pointerId;
    d.on = true;
    d.x = e.clientX;
    d.y = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
    autoRef.current = false;
    tweenRef.current = null;
    view.current.vx = 0;
    view.current.vy = 0;
    setHinted(true);
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d.on || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    d.x = e.clientX;
    d.y = e.clientY;
    const v = view.current;
    v.ry += dx * DRAG_X;
    v.rx = clampRx(v.rx - dy * DRAG_Y);
    v.vx = dx * DRAG_X;
    v.vy = -dy * DRAG_Y;
    const stand = standRef.current;
    if (stand) {
      stand.style.setProperty('--rx', `${v.rx.toFixed(2)}deg`);
      stand.style.setProperty('--ry', `${v.ry.toFixed(2)}deg`);
    }
  };

  const onPointerUp = (e) => {
    const d = dragRef.current;
    if (e.pointerId !== d.id) return;
    d.on = false;
    d.id = null;
  };

  const onKeyDown = (e) => {
    const v = view.current;
    const step = { ArrowLeft: [-6, 0], ArrowRight: [6, 0], ArrowUp: [0, -5], ArrowDown: [0, 5] }[e.key];
    if (!step) return;
    e.preventDefault();
    autoRef.current = false;
    tweenRef.current = null;
    v.ry += step[0];
    v.rx = clampRx(v.rx + step[1]);
    setHinted(true);
    const stand = standRef.current;
    if (stand) {
      stand.style.setProperty('--rx', `${v.rx.toFixed(2)}deg`);
      stand.style.setProperty('--ry', `${v.ry.toFixed(2)}deg`);
    }
  };

  // Xoay tới một góc nhìn đặt sẵn, đi đường ngắn nhất (không quay thừa mấy vòng).
  const goTo = (name) => {
    setPose(name === 'idle' ? null : name);
    const [rx1, ryTarget] = VIEWS[name];
    const v = view.current;
    const delta = (((ryTarget - v.ry + 180) % 360) + 360) % 360 - 180;
    autoRef.current = false;
    v.vx = 0;
    v.vy = 0;
    tweenRef.current = { rx0: v.rx, rx1, ry0: v.ry, ry1: v.ry + delta, t0: performance.now(), ms: 700 };
    setHinted(true);
  };

  // Bấm lại chính ô đang chọn thì trả về góc 3/4 ban đầu.
  const choosePose = (id) => goTo(pose === id ? 'idle' : id);

  // Chuyển mẫu vòng tròn: hết mẫu cuối thì quay lại mẫu đầu.
  const step = (dir) => setActive((i) => (i + dir + models.length) % models.length);
  const stopBubble = (e) => e.stopPropagation();

  return (
    <div className={`std3d${pose === 'base' && !isCard ? ' is-peek' : ''}`}>
      <div
        ref={stageRef}
        className="std3d-stage"
        tabIndex={0}
        role="application"
        aria-label={`Mẫu standee ${model.name} dạng 3D — kéo hoặc dùng phím mũi tên để xoay`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        <div className="std3d-holder">
          <div
            ref={standRef}
            className="std3d-stand"
            style={{
              '--front': `url(${model.front})`,
              '--back': `url(${model.back})`,
              '--base': `url(${model.base})`,
              '--fold': `${((FOLD * 180) / Math.PI).toFixed(3)}deg`,
              '--sin': Math.sin(FOLD).toFixed(5),
              '--cos': Math.cos(FOLD).toFixed(5),
            }}
          >
            {isCard ? (
              <div className="std3d-node">
                <div className="std3d-slab std3d-cardslab">
                  <i className="std3d-f std3d-out std3d-art-front" />
                  <i className="std3d-f std3d-in" />
                  {/* Viền quanh tấm: 4 cạnh thẳng, cộng 4 mặt vát ở góc thay cho cung bo.
                      Một mặt phẳng cho mỗi cung 1/4 là đủ ở độ dày 2mm — sai lệch so với
                      cung thật nhỏ hơn bề dày tấm nên mắt không bắt được. */}
                  <i className="std3d-f std3d-ce std3d-ce-r" />
                  <i className="std3d-f std3d-ce std3d-ce-l" />
                  <i className="std3d-f std3d-ce std3d-ce-t" />
                  <i className="std3d-f std3d-ce std3d-ce-b" />
                  <i className="std3d-f std3d-cc std3d-cc-1" />
                  <i className="std3d-f std3d-cc std3d-cc-2" />
                  <i className="std3d-f std3d-cc std3d-cc-3" />
                  <i className="std3d-f std3d-cc std3d-cc-4" />
                </div>
                <div className="std3d-node std3d-n-cardshadow">
                  <i className="std3d-shadow" />
                </div>
              </div>
            ) : (
            <div className="std3d-node std3d-rig">
              <div className="std3d-node std3d-n-front">
                <div className="std3d-slab std3d-panel">
                  <i className="std3d-f std3d-out std3d-art-front" />
                  <i className="std3d-f std3d-in" />
                  <i className="std3d-f std3d-sl" />
                  <i className="std3d-f std3d-sr" />
                  <i className="std3d-f std3d-st" />
                  <i className="std3d-f std3d-sb" />
                </div>
              </div>

              <div className="std3d-node std3d-n-back">
                <div className="std3d-slab std3d-panel">
                  <i className="std3d-f std3d-out std3d-art-back" />
                  <i className="std3d-f std3d-in" />
                  <i className="std3d-f std3d-sl" />
                  <i className="std3d-f std3d-sr" />
                  <i className="std3d-f std3d-st" />
                  <i className="std3d-f std3d-sb" />
                </div>
              </div>

              <div className="std3d-node std3d-n-base">
                <div className="std3d-slab std3d-base">
                  <i className="std3d-f std3d-out" />
                  <i className="std3d-f std3d-in" />
                  <i className="std3d-f std3d-sl" />
                  <i className="std3d-f std3d-sr" />
                  <i className="std3d-f std3d-st" />
                  <i className="std3d-f std3d-sb" />
                </div>
              </div>

              <div className="std3d-node std3d-n-shadow">
                <i className="std3d-shadow" />
              </div>
            </div>
            )}
          </div>
        </div>

        <p className="std3d-name" aria-live="polite">
          <b>{model.name}</b>
          <span>{model.note}</span>
        </p>

        {/* Chặn pointerdown: để nó nổi lên sân khấu thì stage bắt con trỏ
            (setPointerCapture) và nút mất luôn sự kiện click. */}
        <button
          type="button"
          className="std3d-nav std3d-prev"
          aria-label="Mẫu trước"
          onPointerDown={stopBubble}
          onClick={() => step(-1)}
        >
          <Chevron />
        </button>
        <button
          type="button"
          className="std3d-nav std3d-next"
          aria-label="Mẫu tiếp theo"
          onPointerDown={stopBubble}
          onClick={() => step(1)}
        >
          <Chevron />
        </button>

        <p className="std3d-count" aria-hidden="true">
          {active + 1}/{models.length}
        </p>
        <p className="std3d-spec">
          {isCard
            ? `${CARD}×${CARD} mm · dày ${TH} mm · bo góc ${CARD_R} mm`
            : `A6 ${PW}×${PH} mm · dày ${TH} mm · đáy ${PW}×${DEPTH} mm · cao ${Math.round(HEIGHT)} mm`}
        </p>
        <p className={`std3d-hint${hinted ? ' is-off' : ''}`} aria-hidden="true">
          Kéo để xoay
        </p>
      </div>

      {/* Cụm nút để NGOÀI sân khấu: nổi đè lên thì che mất chân standee, mà chân lại là
          chỗ thấy rõ nhất bề dày giấy với tấm đáy trong. */}
      <div className="std3d-ctrl">
        {poses.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`std3d-btn${pose === p.id ? ' is-on' : ''}`}
            aria-pressed={pose === p.id}
            onClick={() => choosePose(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

// Cho ngẩng lên nhìn từ trên thoải mái, nhưng chặn không cho lộn xuống dưới gầm bàn.
function clampRx(v) {
  return Math.max(-82, Math.min(40, v));
}
