import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from './theme';
import { Star, clamp, tween } from './ui';

// Điện thoại dựng bằng CSS (không phải ảnh chụp) để màn hình diễn được từng bước: popup NFC
// → trang viết đánh giá → 5 sao → gõ nhận xét → bấm Đăng. Quán trên màn hình là quán giả
// định, không phải khách hàng thật.
export const PHONE_W = 380;
export const PHONE_H = 780;

const REVIEW = 'Đồ uống ngon, nhân viên dễ thương. Chắc chắn sẽ quay lại!';

// `at` là mốc thời gian (khung hình, tính trong cảnh chứa điện thoại) của từng bước.
export function Phone({ x, y, scale, rotate, at }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = (start) => spring({ frame: f - start, fps, config: { damping: 12, stiffness: 180 } });

  const banner = interpolate(f, [at.banner, at.banner + 6, at.sheet + 4, at.sheet + 10], [0, 1, 1, 0], clamp);
  const sheet = spring({ frame: f - at.sheet, fps, config: { damping: 20, stiffness: 110 } });
  const typed = Math.round(REVIEW.length * tween(f, [at.type, at.type + 26], [0, 1], (t) => t));
  const press = interpolate(f, [at.post, at.post + 3, at.post + 7], [0, 1, 0], clamp);
  const done = pop(at.post + 5);

  return (
    <div
      style={{
        position: 'absolute',
        left: x - PHONE_W / 2,
        top: y - PHONE_H / 2,
        width: PHONE_W,
        height: PHONE_H,
        transform: `rotate(${rotate}deg) scale(${scale})`,
        borderRadius: 60,
        padding: 13,
        background: 'linear-gradient(145deg, #3a3a3f, #111113 40%, #2a2a2e)',
        boxShadow: '0 40px 80px -30px rgba(0,0,0,.45), 0 0 0 2px #55555b inset',
      }}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 48, overflow: 'hidden', background: '#fff' }}>
        {/* Màn hình khoá */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(165deg, #dce8ff 0%, #f3efff 50%, #ffe8d4 100%)',
            textAlign: 'center',
            color: C.ink,
          }}
        >
          <div style={{ marginTop: 92, fontSize: 19, fontWeight: 600, color: C.ink2 }}>Thứ Năm, 25 tháng 9</div>
          <div style={{ fontSize: 88, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.05 }}>9:41</div>
        </div>

        {/* Popup khi điện thoại đọc được thẻ NFC */}
        <div
          style={{
            position: 'absolute',
            left: 12,
            right: 12,
            top: 58,
            padding: '14px 16px',
            borderRadius: 22,
            background: 'rgba(255,255,255,.92)',
            boxShadow: '0 10px 30px -10px rgba(0,0,0,.25)',
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            opacity: banner,
            transform: `translateY(${(1 - banner) * -30}px)`,
          }}
        >
          <NfcBadge size={40} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Thẻ NFC</div>
            <div style={{ fontSize: 14, color: C.ink2 }}>Mở trang đánh giá Sương Mai Coffee</div>
          </div>
        </div>

        {/* Trang viết đánh giá */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#fff',
            transform: `translateY(${(1 - sheet) * 105}%)`,
            padding: '62px 24px 0',
            color: C.ink,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 18, fontWeight: 600 }}>
            <span style={{ fontSize: 22, color: C.ink3, width: 30 }}>✕</span>
            <span style={{ flex: 1, textAlign: 'center', marginRight: 30 }}>Viết đánh giá</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 30 }}>
            <div
              style={{
                width: 52, height: 52, borderRadius: '50%', background: '#c9853a',
                color: '#fff', fontSize: 24, fontWeight: 700, display: 'grid', placeItems: 'center',
              }}
            >
              S
            </div>
            <div>
              <div style={{ fontSize: 19, fontWeight: 700 }}>Sương Mai Coffee</div>
              <div style={{ fontSize: 14, color: C.ink3 }}>Hoàn Kiếm, Hà Nội</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 40 }}>
            {[0, 1, 2, 3, 4].map((i) => {
              const on = pop(at.stars + i * 5);
              return (
                <div key={i} style={{ position: 'relative', width: 50, height: 50 }}>
                  <Star size={50} color="#dcdce1" style={{ position: 'absolute' }} />
                  <Star size={50} style={{ position: 'absolute', transform: `scale(${on})` }} />
                </div>
              );
            })}
          </div>
          <div
            style={{
              textAlign: 'center', marginTop: 12, fontSize: 17, fontWeight: 600, color: '#c7820c',
              opacity: tween(f, [at.stars + 22, at.stars + 28], [0, 1]),
            }}
          >
            Tuyệt vời!
          </div>

          <div
            style={{
              marginTop: 22, height: 150, borderRadius: 16, border: `1.5px solid ${typed ? C.accent : C.line}`,
              padding: 16, fontSize: 18, lineHeight: 1.45, textAlign: 'left',
            }}
          >
            {typed ? REVIEW.slice(0, typed) : <span style={{ color: C.ink3 }}>Chia sẻ trải nghiệm của bạn…</span>}
            {typed > 0 && typed < REVIEW.length && Math.floor(f / 8) % 2 === 0 && (
              <span style={{ borderLeft: `2px solid ${C.accent}`, marginLeft: 1 }} />
            )}
          </div>

          <div
            style={{
              position: 'absolute', left: 24, right: 24, bottom: 46, height: 58, borderRadius: 29,
              background: press ? '#005bb8' : C.accent, color: '#fff', fontSize: 20, fontWeight: 700,
              display: 'grid', placeItems: 'center', transform: `scale(${1 - 0.05 * press})`,
            }}
          >
            Đăng
          </div>

          {/* Xác nhận đã đăng */}
          <div
            style={{
              position: 'absolute', inset: 0, background: `rgba(255,255,255,${0.9 * Math.min(1, done)})`,
              display: 'grid', placeItems: 'center', opacity: Math.min(1, done * 1.5),
            }}
          >
            <div style={{ textAlign: 'center', transform: `scale(${0.7 + 0.3 * done})` }}>
              <div
                style={{
                  width: 92, height: 92, margin: '0 auto', borderRadius: '50%', background: '#1fa855',
                  display: 'grid', placeItems: 'center',
                }}
              >
                <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, marginTop: 18 }}>Đã đăng đánh giá</div>
              <div style={{ fontSize: 17, color: C.ink2, marginTop: 4 }}>Cảm ơn bạn!</div>
            </div>
          </div>
        </div>

        {/* Dynamic island */}
        <div style={{ position: 'absolute', top: 14, left: '50%', width: 116, height: 34, marginLeft: -58, borderRadius: 17, background: '#000' }} />
      </div>
    </div>
  );
}

function NfcBadge({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="15" fill={C.accent} />
      <g fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round">
        <path d="M20 24a11 11 0 0 1 0 16" />
        <path d="M30 18a19 19 0 0 1 0 28" />
        <path d="M40 12a27 27 0 0 1 0 40" />
      </g>
    </svg>
  );
}
