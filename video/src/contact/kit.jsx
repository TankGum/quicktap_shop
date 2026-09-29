import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

// Video "Liên hệ đặt hàng" — phong cách KHỐI MÀU: ba màu đặc (xanh thương hiệu, đen, trắng),
// chữ in hoa rất đậm cỡ khổng lồ, chuyển cảnh bằng tấm màu quét phủ kín khung. Cố ý KHÔNG có
// icon và KHÔNG có chữ chuyển màu.
export const K = { blue: '#0071e3', black: '#0d0d0f', white: '#ffffff' };
export const TOTAL = 450; // 15 giây ở 30fps
export const PHONE = '0388 102 842';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };
export const ease = (f, [a, b], e = Easing.out(Easing.poly(4))) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: e });

export function useDir() {
  const { width, height } = useVideoConfig();
  const portrait = height > width;
  return { portrait, W: width, H: height, pick: (l, p) => (portrait ? p : l) };
}

// Một "tấm": nền màu đặc phủ kín khung, quét vào từ một cạnh trong WIPE khung hình đầu.
// Tấm sau luôn đè kín tấm trước nên không cần cho tấm trước mờ đi.
const WIPE = 9;
export function Panel({ bg, from = 'right', children }) {
  const f = useCurrentFrame();
  const r = `${(1 - ease(f, [0, WIPE], Easing.inOut(Easing.cubic))) * 100}%`;
  // `from` là cạnh tấm màu xuất phát: đi vào từ phải thì phần còn bị cắt nằm bên TRÁI.
  const clip = { right: `inset(0 0 0 ${r})`, left: `inset(0 ${r} 0 0)`, bottom: `inset(${r} 0 0 0)`, top: `inset(0 0 ${r} 0)` }[from];
  return (
    <AbsoluteFill style={{ background: bg, clipPath: f < WIPE ? clip : undefined }}>
      {children}
    </AbsoluteFill>
  );
}

// Dòng chữ trồi lên sau mép che. Khung che có đệm trên/dưới đủ cho dấu tiếng Việt chồng hai
// tầng trên chữ in hoa (Ặ, Ẫ…) — thiếu đệm là mất dấu. Kết thúc ĐÚNG ở 1 (không dùng spring)
// để khung cuối video trùng hệt khung đầu.
export function Line({ at, children, style, dur = 11, from = 'bottom' }) {
  const f = useCurrentFrame();
  const t = ease(f, [at, at + dur]);
  // Đẩy xuống 140% (không phải 100%): khung che có đệm trên 0.45em cho dấu, nên chữ chỉ lùi
  // đúng một chiều cao dòng thì phần dấu vẫn ló ra khỏi mép dưới trước khi dòng trồi lên.
  const move = from === 'bottom' ? `translateY(${(1 - t) * 140}%)` : `translateX(${(from === 'left' ? -1 : 1) * (1 - t) * 110}%)`;
  return (
    <div style={{ ...style, overflow: 'hidden', paddingTop: '0.45em', marginTop: '-0.45em', paddingBottom: '0.12em', marginBottom: '-0.12em' }}>
      <div style={{ transform: move }}>{children}</div>
    </div>
  );
}

// Chữ "đập" vào khung: to hơn rồi co về đúng cỡ trong vài khung hình.
export function Slam({ at, children, style }) {
  const f = useCurrentFrame();
  const t = ease(f, [at, at + 7], Easing.out(Easing.cubic));
  return (
    <div style={{ ...style, opacity: t > 0 ? 1 : 0, transform: `scale(${1.35 - 0.35 * t})` }}>{children}</div>
  );
}

// Chữ in hoa cỡ lớn dùng chung. lineHeight không được sát hơn ~1.0: chữ in hoa tiếng Việt có
// dấu chồng hai tầng (Ặ, Ầ, Ễ) — dòng dưới sát quá thì dấu của nó chạm vào chân dòng trên và
// đọc nhầm ("LIÊN" thành "LIỆN").
export const big = (size, color) => ({
  fontSize: size, fontWeight: 900, lineHeight: 1.04, letterSpacing: '-0.045em',
  textTransform: 'uppercase', color,
});
export const small = (size, color) => ({
  fontSize: size, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color,
});
