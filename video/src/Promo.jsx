import { AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { fontFamily, C } from './theme';
import { useLayout } from './layout';
import { TapDemo } from './scenes/TapDemo';
import { CardCarousel } from './scenes/CardCarousel';
import { Platforms } from './scenes/Platforms';
import { Finale } from './scenes/Finale';

export const PROMO_DURATION = 600; // 20 giây ở 30fps

// Ảnh mặt in của mô hình 3D là background-image CSS — Remotion KHÔNG chờ loại ảnh này tải
// xong trước khi chụp khung hình. <Img> thì có chờ, nên nạp trước hết qua một lớp ẩn.
const PRELOAD = [
  ...['google', 'tripadvisor', 'booking'].flatMap((m) => ['front', 'back', 'base'].map((s) => `${m}-${s}`)),
  'card-google-nau', 'card-google-xanh-la', 'card-google-xanh-duong', 'card-tripadvisor',
].map((n) => staticFile(`assets/standee3d/${n}.png`));

// Hai quầng màu rất nhạt trôi chậm sau nền. Chu kỳ đúng bằng độ dài video để khung cuối và
// khung đầu trùng nhau khi lặp.
function Backdrop() {
  const f = useCurrentFrame();
  const { W, H } = useLayout();
  const t = (f / PROMO_DURATION) * Math.PI * 2;
  const blob = (x, y, r, color) => ({
    position: 'absolute',
    left: x - r,
    top: y - r,
    width: 2 * r,
    height: 2 * r,
    borderRadius: '50%',
    background: `radial-gradient(circle, ${color}, transparent 68%)`,
  });
  const r = Math.max(W, H) * 0.42;
  return (
    <AbsoluteFill>
      <div style={blob(W * (0.26 + 0.07 * Math.sin(t)), H * (0.32 + 0.06 * Math.cos(t)), r, 'rgba(0,113,227,.075)')} />
      <div style={blob(W * (0.78 + 0.06 * Math.cos(t)), H * (0.72 + 0.05 * Math.sin(t)), r * 0.9, 'rgba(245,165,36,.06)')} />
    </AbsoluteFill>
  );
}

export function Promo() {
  return (
    <AbsoluteFill
      style={{
        fontFamily,
        color: C.ink,
        background: `radial-gradient(70% 62% at 50% 44%, #ffffff 0%, ${C.bg} 64%, #ebebee 100%)`,
      }}
    >
      <Backdrop />
      <div style={{ display: 'none' }}>
        {PRELOAD.map((src) => <Img key={src} src={src} />)}
      </div>

      {/* Các cảnh gối lên nhau ở chỗ chuyển cảnh, nên mỗi Sequence dài hơn khoảng cách tới
          cảnh sau. */}
      <Sequence from={0} durationInFrames={216} name="Chạm standee">
        <TapDemo />
      </Sequence>
      <Sequence from={212} durationInFrames={172} name="Bảng NFC">
        <CardCarousel />
      </Sequence>
      <Sequence from={374} durationInFrames={112} name="Nền tảng">
        <Platforms />
      </Sequence>
      <Sequence from={480} durationInFrames={120} name="Dàn sản phẩm">
        <Finale />
      </Sequence>
    </AbsoluteFill>
  );
}
