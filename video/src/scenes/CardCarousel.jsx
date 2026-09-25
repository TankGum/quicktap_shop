import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Card, cardPoint } from '../models';
import { C } from '../theme';
import { useLayout } from '../layout';
import { Icon, LineReveal, Ripple, clamp, tween } from '../ui';

// Mỗi bảng dừng giữa khung một nhịp, kèm một ý bán hàng. Hiệu ứng trên bảng chỉ ra đúng
// chỗ đang nói tới trên bản in (vùng NFC, mã QR...).
const CARDS = [
  { art: 'card-google-nau', icon: 'nfc', title: 'Chip NFC', sub: 'Chạm điện thoại là mở trang đánh giá' },
  { art: 'card-google-xanh-la', icon: 'qr', title: 'Mã QR in sẵn', sub: 'Máy không có NFC thì quét mã' },
  { art: 'card-google-xanh-duong', icon: 'drop', title: 'Chống nước', sub: 'Mặt mica bóng, lau chùi thoải mái' },
  { art: 'card-tripadvisor', icon: 'palette', title: 'In logo riêng', sub: 'Màu sắc và nền tảng theo ý quán' },
];
// Khung hình mà bảng thứ i về tới giữa.
const STOPS = [10, 50, 90, 130];
const OUT = [156, 168];

const L = {
  landscape: { center: { x: 960, y: 470 }, mm: 5.2, spacing: 660, kicker: 70, label: 800, titleSize: 64, subSize: 30, dots: 1010 },
  portrait: { center: { x: 540, y: 900 }, mm: 7.2, spacing: 780, kicker: 280, label: 1370, titleSize: 84, subSize: 36, dots: 1640 },
};

// Toạ độ trên ảnh bảng vuông (tỉ lệ 0..1), đo từ file card-*.png.
const NFC_OVAL = [0.255, 0.18];
const QR = { u0: 0.675, u1: 0.865, v0: 0.095, v1: 0.275 };
const LOGO = [0.5, 0.64];

export function CardCarousel() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { pick, W, H } = useLayout();
  const P = pick(L);

  // Vị trí "đầu đọc" trên dải bảng: 0 = bảng đầu nằm giữa, 3 = bảng cuối nằm giữa.
  const step = (at) => spring({ frame: f - at, fps, config: { damping: 17, mass: 0.7, stiffness: 120 } });
  const center = -1.6 + 1.6 * step(STOPS[0] - 8) + step(STOPS[1] - 10) + step(STOPS[2] - 10) + step(STOPS[3] - 10);

  const out = tween(f, OUT, [0, 1]);

  const cams = CARDS.map((_, i) => {
    const d = i - center;
    const s = 1 - 0.32 * Math.min(Math.abs(d), 1.6);
    return {
      d,
      x: P.center.x + d * P.spacing,
      y: P.center.y + 10 * Math.sin(f / 16 + i),
      mm: P.mm * s * (1 - 0.12 * out),
      rx: -8,
      ry: -9 - d * 34,
      opacity: interpolate(Math.abs(d), [0, 1, 1.8], [1, 0.55, 0], clamp),
    };
  });
  // 1 khi bảng đứng giữa khung, về 0 khi nó trượt ra — hiệu ứng và nhãn tắt theo.
  const focus = cams.map((c) => interpolate(Math.abs(c.d), [0, 0.45], [1, 0], clamp));

  const [nfcCam, qrCam, , logoCam] = cams;
  const nfc = cardPoint(...NFC_OVAL, nfcCam);
  const qrCorners = [
    cardPoint(QR.u0, QR.v0, qrCam), cardPoint(QR.u1, QR.v0, qrCam),
    cardPoint(QR.u1, QR.v1, qrCam), cardPoint(QR.u0, QR.v1, qrCam),
  ];
  // Vạch quét chạy xuống rồi lên một lượt.
  const scan = interpolate(f, [STOPS[1], STOPS[1] + 14, STOPS[1] + 28], [0, 1, 0], clamp);
  const scanV = QR.v0 + (QR.v1 - QR.v0) * scan;
  const scanA = cardPoint(QR.u0 - 0.01, scanV, qrCam);
  const scanB = cardPoint(QR.u1 + 0.01, scanV, qrCam);
  const qrOn = focus[1] * interpolate(f, [STOPS[1] - 4, STOPS[1]], [0, 1], clamp);
  const logo = cardPoint(...LOGO, logoCam);

  // Thứ tự vẽ: bảng gần giữa vẽ sau cùng để đè lên hai bảng bên.
  const order = cams.map((c, i) => i).sort((a, b) => Math.abs(cams[b].d) - Math.abs(cams[a].d));

  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      <div style={{ position: 'absolute', top: P.kicker, width: '100%', textAlign: 'center' }}>
        <LineReveal delay={4} style={{ fontSize: 32, fontWeight: 600, color: C.accent }}>
          Bảng NFC dán tường & quầy · 10×10 cm
        </LineReveal>
      </div>

      {order.map((i) => (
        <Card
          key={CARDS[i].art}
          art={CARDS[i].art}
          {...cams[i]}
          // Vệt bóng quét qua mặt mica đúng lúc nói "Chống nước".
          sheen={i === 2 ? tween(f, [STOPS[2] - 2, STOPS[2] + 26], [-0.3, 1.3]) : null}
        />
      ))}

      <Ripple x={nfc.x} y={nfc.y} start={STOPS[0] + 4} size={P.mm * 55} rings={3} gap={8} life={24} opacity={focus[0]} />

      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, opacity: qrOn }}>
        <polygon
          points={qrCorners.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="rgba(0,113,227,.10)"
          stroke={C.accent}
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <line x1={scanA.x} y1={scanA.y} x2={scanB.x} y2={scanB.y} stroke={C.accent} strokeWidth="5" strokeLinecap="round" />
      </svg>

      <Ripple x={logo.x} y={logo.y} start={STOPS[3] + 2} size={P.mm * 62} rings={2} gap={9} life={26} opacity={focus[3]} />

      {CARDS.map(({ title, sub, icon }, i) => {
        const a = focus[i];
        if (a <= 0) return null;
        return (
          <div
            key={title}
            style={{
              position: 'absolute', top: P.label, width: '100%', textAlign: 'center',
              opacity: a, transform: `translateX(${cams[i].d * 160}px)`,
            }}
          >
            <div
              style={{
                display: 'inline-flex', alignItems: 'center', gap: P.titleSize * 0.28,
                fontSize: P.titleSize, fontWeight: 700, letterSpacing: '-0.03em',
              }}
            >
              <Icon name={icon} size={P.titleSize * 1.05} />
              {title}
            </div>
            <div style={{ fontSize: P.subSize, fontWeight: 500, color: C.ink2, marginTop: 10 }}>{sub}</div>
          </div>
        );
      })}

      {/* Chấm tiến trình: cho biết đang ở ý thứ mấy trong 4 ý. */}
      <div style={{ position: 'absolute', top: P.dots, width: '100%', display: 'flex', justifyContent: 'center', gap: 12 }}>
        {CARDS.map((c, i) => (
          <div
            key={c.art}
            style={{
              width: 10 + 26 * focus[i], height: 10, borderRadius: 5,
              background: focus[i] > 0.5 ? C.ink : C.line,
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
}
