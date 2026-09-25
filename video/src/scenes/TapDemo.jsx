import { AbsoluteFill, Easing, spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { Standee, standeeFrontPoint } from '../models';
import { Phone, PHONE_W, PHONE_H } from '../Phone';
import { C } from '../theme';
import { OPENING, useLayout } from '../layout';
import { LineReveal, Ripple, clamp, inOutCubic, tween } from '../ui';

// Vị trí trên ảnh mặt trước standee (tỉ lệ 0..1): tâm nút "TAP YOUR PHONE" và icon điện
// thoại có sóng NFC trong nút đó.
const PILL = [0.5, 0.889];
const NFC_ICON = [0.325, 0.889];

// Mốc thời gian (khung hình trong cảnh).
const T = {
  turn: [0, 60],
  zoomIn: [60, 94],
  phoneIn: 84,
  touch: 108,
  zoomOut: [126, 160],
  exit: [202, 216],
};
const PHONE_AT = { banner: 112, sheet: 122, stars: 140, type: 160, post: 186 };

const L = {
  landscape: {
    pill: { x: 960, y: 560 },
    zoomMm: 8.2,
    touchScale: 1.35,
    after: { x: 900, y: 560, mm: 3.4, rx: -8, ry: -18 },
    phone: { x: 1440, y: 545, s: 1 },
    head: { left: 150, top: 368, width: 760, align: 'left', size: 96 },
    caption: { left: 150, top: 400, width: 560, align: 'left', size: 80 },
  },
  portrait: {
    pill: { x: 540, y: 1000 },
    zoomMm: 8.4,
    touchScale: 1.3,
    after: { x: 540, y: 600, mm: 2.5, rx: -8, ry: -18 },
    phone: { x: 540, y: 1390, s: 1.1 },
    head: { left: 0, top: 340, width: 1080, align: 'center', size: 92 },
    caption: { left: 0, top: 130, width: 1080, align: 'center', size: 76 },
  },
};

const lerp = (a, b, t) => a + (b - a) * t;

export function TapDemo() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { pick, W, H } = useLayout();
  const P = pick(L);
  const O = pick(OPENING);

  const turn = tween(f, T.turn, [0, 1]);
  const zin = tween(f, T.zoomIn, [0, 1], inOutCubic);
  const zout = tween(f, T.zoomOut, [0, 1], inOutCubic);
  const exit = tween(f, T.exit, [0, 1], Easing.in(Easing.cubic));

  // Khung đầu tiên (f = 0) phải đúng tư thế OPENING — cảnh cuối trả standee về đây để lặp.
  const rx0 = lerp(O.rx, -6, turn);
  const ry0 = lerp(O.ry, -6, turn);

  // Zoom kiểu ống kính: mm tăng theo cấp số nhân để tốc độ phóng đều mắt, đồng thời dời
  // tâm standee sao cho nút "TAP YOUR PHONE" trượt dần vào P.pill.
  const zoomCam = (t) => {
    const mm = O.mm * Math.pow(P.zoomMm / O.mm, t);
    const rx = lerp(rx0, -3, t);
    const ry = lerp(ry0, 0, t);
    const pill = standeeFrontPoint(...PILL, { x: 0, y: 0, mm, rx, ry });
    return { mm, rx, ry, x: lerp(O.x, P.pill.x - pill.x, t), y: lerp(O.y, P.pill.y - pill.y, t) };
  };
  const Z = zoomCam(1);
  let cam = zoomCam(zin);
  if (zout > 0) {
    cam = {
      mm: Z.mm * Math.pow(P.after.mm / Z.mm, zout),
      rx: lerp(Z.rx, P.after.rx, zout),
      ry: lerp(Z.ry, P.after.ry, zout),
      x: lerp(Z.x, P.after.x, zout),
      y: lerp(Z.y, P.after.y, zout),
    };
  }
  const shiftX = -exit * W;

  // Điện thoại: bay vào từ góc dưới bên trái, áp góc trên-phải của máy (gần chỗ đặt ăng-ten
  // NFC) lên icon — lệch sang trái để dòng chữ "TAP YOUR PHONE" vẫn đọc được — rồi lùi ra
  // một bên khi máy quay kéo ra xa để khoe màn hình.
  const icon = standeeFrontPoint(...NFC_ICON, Z);
  const sT = P.touchScale;
  const touchPos = { x: icon.x - 0.45 * PHONE_W * sT, y: icon.y + 0.4 * PHONE_H * sT };
  const enter = spring({ frame: f - T.phoneIn, fps, config: { damping: 18, mass: 0.9 } });
  const press = interpolate(f, [T.touch, T.touch + 4, T.touch + 10], [0, 1, 0], clamp);
  const phone = {
    x: lerp(touchPos.x - (1 - enter) * W * 0.5, P.phone.x, zout) + shiftX,
    y: lerp(touchPos.y + (1 - enter) * H * 0.55, P.phone.y, zout),
    scale: lerp(sT * (1 - 0.035 * press), P.phone.s, zout),
    rotate: lerp(14 - (1 - enter) * 20, 0, zout),
  };

  const headOut = tween(f, [56, 70], [0, 1]);
  const H1 = P.head;
  const C1 = P.caption;
  const capIn = f >= 146;

  return (
    <AbsoluteFill style={{ filter: exit ? `blur(${exit * 10}px)` : undefined }}>
      <Standee model="google" {...cam} x={cam.x + shiftX} />

      <div
        style={{
          position: 'absolute', left: H1.left, top: H1.top, width: H1.width, textAlign: H1.align,
          opacity: 1 - headOut, transform: `translateY(${-40 * headOut}px)`,
        }}
      >
        <LineReveal delay={6} style={{ fontSize: 32, fontWeight: 600, color: C.accent }}>
          Standee để bàn A6
        </LineReveal>
        <div style={{ height: 16 }} />
        <LineReveal delay={10} style={{ fontSize: H1.size, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.04 }}>
          Chạm một cái
        </LineReveal>
        <LineReveal delay={14} style={{ fontSize: H1.size, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.04 }}>
          là mở đánh giá
        </LineReveal>
      </div>

      {f >= T.phoneIn && <Phone {...phone} at={PHONE_AT} />}

      <Ripple x={icon.x} y={icon.y} start={T.touch + 2} size={760} rings={3} gap={6} life={26} />

      {capIn && (
        <div
          style={{
            position: 'absolute', left: C1.left + shiftX, top: C1.top, width: C1.width, textAlign: C1.align,
          }}
        >
          <LineReveal delay={146} style={{ fontSize: 32, fontWeight: 600, color: C.accent }}>
            Không cần cài app
          </LineReveal>
          <div style={{ height: 14 }} />
          <LineReveal delay={150} style={{ fontSize: C1.size, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.04 }}>
            Chạm là mở
          </LineReveal>
          <LineReveal delay={154} style={{ fontSize: C1.size, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.04 }}>
            trang đánh giá
          </LineReveal>
        </div>
      )}
    </AbsoluteFill>
  );
}
