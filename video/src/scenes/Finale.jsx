import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Card, Standee } from '../models';
import { C } from '../theme';
import { OPENING, useLayout } from '../layout';
import { BrandMark, LineReveal, Star, inOutCubic, tween } from '../ui';

const CARD_ARTS = ['card-google-nau', 'card-google-xanh-la', 'card-google-xanh-duong', 'card-tripadvisor'];

// Ngang: 2 bảng mỗi bên standee, cùng đứng trên một mặt sàn. Dọc: standee lớn ở giữa, 4
// bảng xếp một hàng bên dưới.
const L = {
  landscape: {
    stars: 92, starSize: 46, tagline: 160, tagSize: 100,
    standee: { x: 960, y: 632, mm: 3.05 },
    cards: [300, 625, 1295, 1620].map((x) => ({ x, y: 705 })), cardMm: 2.9, cardRy: [26, 16, -16, -26],
    brand: 950, brandStack: false,
  },
  portrait: {
    stars: 200, starSize: 52, tagline: 270, tagSize: 96,
    standee: { x: 540, y: 1000, mm: 3.6 },
    cards: [165, 415, 665, 915].map((x) => ({ x, y: 1470 })), cardMm: 2.15, cardRy: [22, 10, -10, -22],
    brand: 1680, brandStack: true,
  },
};
const CARD_DELAY = [12, 6, 6, 12];

const lerp = (a, b, t) => a + (b - a) * t;

export function Finale() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { pick } = useLayout();
  const P = pick(L);
  const O = pick(OPENING);

  // Đoạn nối vòng lặp: mọi thứ lui đi, riêng standee Google trôi về đúng tư thế mở màn của
  // cảnh đầu — khung cuối trùng khung đầu, video lặp không có vết cắt.
  const textOut = tween(f, [86, 98], [0, 1]);
  const othersOut = tween(f, [90, 104], [0, 1]);
  const back = tween(f, [92, 119], [0, 1], inOutCubic);

  const sp = spring({ frame: f, fps, config: { damping: 15, mass: 0.8 } });
  const lineup = {
    x: P.standee.x,
    y: P.standee.y + (1 - sp) * 260,
    mm: P.standee.mm,
    rx: -10,
    ry: -24 + 5 * Math.sin(f / 22 + 1.8) + (1 - sp) * 70,
  };
  const standee = {
    x: lerp(lineup.x, O.x, back),
    y: lerp(lineup.y, O.y, back),
    mm: lineup.mm * Math.pow(O.mm / lineup.mm, back),
    rx: lerp(lineup.rx, O.rx, back),
    ry: lerp(lineup.ry, O.ry, back),
  };

  const textStyle = { fontSize: P.tagSize, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.05 };

  return (
    <AbsoluteFill>
      <div style={{ opacity: 1 - textOut }}>
        <div style={{ position: 'absolute', top: P.stars, width: '100%', display: 'flex', justifyContent: 'center', gap: 10 }}>
          {[0, 1, 2, 3, 4].map((i) => {
            const p = spring({ frame: f - 16 - i * 3, fps, config: { damping: 11, stiffness: 160 } });
            return <Star key={i} size={P.starSize} style={{ transform: `scale(${p})` }} />;
          })}
        </div>
        <div style={{ position: 'absolute', top: P.tagline, width: '100%', textAlign: 'center' }}>
          <LineReveal delay={0} style={textStyle}>Tăng đánh giá 5 sao</LineReveal>
          <LineReveal delay={5} style={{ ...textStyle, color: C.accent }}>chỉ với 1 chạm</LineReveal>
        </div>
      </div>

      {P.cards.map((spot, i) => {
        const p = spring({ frame: f - CARD_DELAY[i], fps, config: { damping: 15, mass: 0.8 } });
        return (
          <Card
            key={CARD_ARTS[i]}
            art={CARD_ARTS[i]}
            x={spot.x}
            y={spot.y + (1 - p) * 260 + othersOut * 80}
            mm={P.cardMm}
            rx={-10}
            ry={P.cardRy[i] + 5 * Math.sin(f / 22 + i * 0.9) + (1 - p) * (spot.x < P.standee.x ? -70 : 70)}
            opacity={Math.min(1, p * 1.4) * (1 - othersOut)}
          />
        );
      })}

      <Standee model="google" {...standee} opacity={Math.min(1, sp * 1.4)} />

      <div
        style={{
          position: 'absolute', top: P.brand, width: '100%', display: 'flex',
          flexDirection: P.brandStack ? 'column' : 'row', justifyContent: 'center', alignItems: 'center',
          gap: P.brandStack ? 14 : 22,
          opacity: tween(f, [30, 42], [0, 1]) * (1 - textOut),
          transform: `translateY(${tween(f, [30, 42], [24, 0])}px)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <BrandMark size={P.brandStack ? 60 : 52} />
          <span style={{ fontSize: P.brandStack ? 48 : 40, fontWeight: 700, letterSpacing: '-0.02em' }}>QuickTapReview</span>
        </div>
        {!P.brandStack && <span style={{ width: 2, height: 36, background: C.line }} />}
        <span style={{ fontSize: P.brandStack ? 34 : 32, fontWeight: 500, color: C.ink2 }}>
          Freeship Hà Nội · Giao toàn quốc
        </span>
      </div>
    </AbsoluteFill>
  );
}
