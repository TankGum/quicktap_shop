import { AbsoluteFill, Img, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Standee } from '../models';
import { C } from '../theme';
import { useLayout } from '../layout';
import { LineReveal, tween } from '../ui';

// Ba mẫu standee cho ba nền tảng lớn: mẫu giữa đứng trước, hai mẫu hai bên lùi ra sau.
const STANDEES = [
  { model: 'tripadvisor', delay: 6, side: -1 },
  { model: 'booking', delay: 10, side: 1 },
  { model: 'google', delay: 0, side: 0 },
];

// Các nền tảng khác chỉ cần đổi link — logo lấy từ public/assets/logo_brands.
const CHIPS = [
  { label: 'Facebook', icon: 'assets/logo_brands/Facebook.png' },
  { label: 'Instagram', icon: 'assets/logo_brands/ig.png' },
  { label: '…hoặc bất kỳ link nào', icon: null },
];

const L = {
  landscape: {
    kicker: 84, title: 136, titleSize: 76, lines: ['Google Maps · TripAdvisor · Booking.com'],
    center: { x: 960, y: 610, mm: 3.1 }, side: { dx: 430, y: 575, mm: 2.6 }, chips: 905,
  },
  portrait: {
    kicker: 190, title: 250, titleSize: 88, lines: ['Google Maps', 'TripAdvisor', 'Booking.com'],
    center: { x: 540, y: 1080, mm: 3.6 }, side: { dx: 330, y: 1000, mm: 2.8 }, chips: 1500,
  },
};

export function Platforms() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { pick, portrait } = useLayout();
  const P = pick(L);
  const out = tween(f, [98, 110], [0, 1]);

  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      <div style={{ position: 'absolute', top: P.kicker, width: '100%', textAlign: 'center' }}>
        <LineReveal delay={0} style={{ fontSize: 32, fontWeight: 600, color: C.accent }}>
          Đưa khách thẳng tới
        </LineReveal>
      </div>
      <div style={{ position: 'absolute', top: P.title, width: '100%', textAlign: 'center' }}>
        {P.lines.map((line, i) => (
          <LineReveal
            key={line}
            delay={3 + i * 4}
            style={{ fontSize: P.titleSize, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.08 }}
          >
            {line}
          </LineReveal>
        ))}
      </div>

      {STANDEES.map(({ model, delay, side }) => {
        const p = spring({ frame: f - 2 - delay, fps, config: { damping: 15, mass: 0.8 } });
        const spot = side === 0 ? P.center : { x: P.center.x + side * P.side.dx, y: P.side.y, mm: P.side.mm };
        const sway = 5 * Math.sin(f / 20 + side);
        return (
          <Standee
            key={model}
            model={model}
            x={spot.x}
            y={spot.y + (1 - p) * 300}
            mm={spot.mm * (1 - 0.08 * out)}
            rx={-9}
            ry={-14 - side * 22 + sway + (1 - p) * 80 * (side || 1)}
            opacity={Math.min(1, p * 1.5)}
          />
        );
      })}

      <div
        style={{
          position: 'absolute', top: P.chips, left: 0, right: 0, display: 'flex', flexWrap: 'wrap',
          justifyContent: 'center', gap: portrait ? 16 : 20, padding: '0 60px',
        }}
      >
        {CHIPS.map(({ label, icon }, i) => {
          const p = spring({ frame: f - 34 - i * 5, fps, config: { damping: 14 } });
          return (
            <div
              key={label}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 12, padding: '14px 26px 14px 16px',
                paddingLeft: icon ? 16 : 26, borderRadius: 999, background: '#fff',
                boxShadow: '0 10px 30px -14px rgba(0,0,0,.25)', fontSize: portrait ? 34 : 30,
                fontWeight: 600, color: icon ? C.ink : C.ink2,
                opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * 30}px) scale(${0.9 + 0.1 * p})`,
              }}
            >
              {icon && <Img src={staticFile(icon)} style={{ width: 40, height: 40, objectFit: 'contain' }} />}
              {label}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
