import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from './theme';

export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };
export const outCubic = Easing.out(Easing.cubic);
export const inOutCubic = Easing.inOut(Easing.cubic);

export const tween = (f, range, out, easing = outCubic) =>
  interpolate(f, range, out, { ...clamp, easing });

// Một dòng chữ trồi lên từ sau mép che (kiểu apple.com): chữ nằm trong một khung overflow
// hidden, bản thân nó trượt từ dưới lên. Khung có đệm dưới để dấu tiếng Việt (ạ, ộ, ỵ) và
// chân chữ g/y không bị cắt cụt — cỡ chữ phải đặt ngay trên khung (không phải lớp trong),
// vì đệm tính bằng em theo cỡ chữ của chính khung.
export function LineReveal({ delay = 0, style, children }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - delay, fps, config: { damping: 200 }, durationInFrames: 24 });
  return (
    <div style={{ ...style, overflow: 'hidden', paddingBottom: '0.16em', marginBottom: '-0.16em' }}>
      <div style={{ transform: `translateY(${(1 - p) * 115}%)` }}>{children}</div>
    </div>
  );
}

// Sóng NFC: vài vòng tròn loang ra từ một điểm rồi tan.
export function Ripple({ x, y, start, size = 260, rings = 3, gap = 8, life = 30, color = C.accent, opacity = 1 }) {
  const f = useCurrentFrame();
  return Array.from({ length: rings }, (_, i) => {
    const t = (f - start - i * gap) / life;
    if (t < 0 || t > 1) return null;
    const d = size * outCubic(t);
    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: x - d / 2,
          top: y - d / 2,
          width: d,
          height: d,
          borderRadius: '50%',
          border: `${Math.max(2, 5 * (1 - t))}px solid ${color}`,
          opacity: 0.85 * (1 - t) * opacity,
        }}
      />
    );
  });
}

export function Star({ size, color = C.star, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
      <path
        fill={color}
        d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"
      />
    </svg>
  );
}

// Logo QuickTap — cùng hình với public/favicon.svg.
export function BrandMark({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="15" fill={C.ink} />
      <g fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round">
        <path d="M20 24a11 11 0 0 1 0 16" />
        <path d="M30 18a19 19 0 0 1 0 28" />
        <path d="M40 12a27 27 0 0 1 0 40" />
      </g>
    </svg>
  );
}

// Icon nhỏ cạnh nhãn từng ý bán hàng ở cảnh bảng NFC. Mỗi icon là một HÀM trả JSX, không
// phải JSX viết thẳng ở cấp module: bundler của Remotion chạy module này trước khi React sẵn
// sàng, JSX ở cấp module ném "React is not defined".
const ICONS = {
  nfc: () => (
    <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M7.5 9a4.5 4.5 0 0 1 0 6" />
      <path d="M11 6.5a8 8 0 0 1 0 11" />
      <path d="M14.5 4a11.5 11.5 0 0 1 0 16" />
    </g>
  ),
  qr: () => (
    <g fill="currentColor">
      <path d="M3 3h7v7H3zm2 2v3h3V5zM14 3h7v7h-7zm2 2v3h3V5zM3 14h7v7H3zm2 2v3h3v-3z" />
      <path d="M14 14h3v3h-3zM18 18h3v3h-3zM18 14h3v2h-3zM14 18h2v3h-2z" />
    </g>
  ),
  drop: () => <path fill="currentColor" d="M12 2.5c3.3 4.3 6.5 8 6.5 11.6a6.5 6.5 0 0 1-13 0C5.5 10.5 8.7 6.8 12 2.5z" />,
  palette: () => (
    <g>
      <path fill="currentColor" d="M12 3a9 9 0 0 0 0 18c1.2 0 1.8-.8 1.8-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.7 1.7-1.7H16a5 5 0 0 0 5-5C21 6.4 17 3 12 3z" />
      <g fill="#fff">
        <circle cx="7.5" cy="11" r="1.5" /><circle cx="10" cy="7" r="1.5" />
        <circle cx="14.5" cy="7" r="1.5" /><circle cx="17" cy="11" r="1.5" />
      </g>
    </g>
  ),
};

export function Icon({ name, size, color = C.accent, bg = '#e8f1fd' }) {
  return (
    <span
      style={{
        display: 'inline-grid', placeItems: 'center', width: size, height: size,
        borderRadius: size * 0.28, background: bg, color,
      }}
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" aria-hidden="true">{ICONS[name]()}</svg>
    </span>
  );
}
