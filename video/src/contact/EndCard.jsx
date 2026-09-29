import { useCurrentFrame } from 'remotion';
import { K, Line, PHONE, big, ease, small, useDir } from './kit';

// Khối chốt: tấm xanh, "LIÊN HỆ ĐẶT HÀNG" khổng lồ, dải đen dưới cùng mang số điện thoại.
// Xuất hiện ở khung ĐẦU (đã dựng xong, at = -999) và cảnh CUỐI (dựng lại từ at = 0), nên khung
// cuối trùng khung đầu và video lặp liền mạch. Mọi chuyển động kết thúc đúng ở giá trị cuối.
export function EndCard({ at = -999 }) {
  const f = useCurrentFrame();
  const { portrait, pick } = useDir();
  const pad = pick(100, 72);
  const strip = pick(270, 560);
  const stripT = ease(f, [at + 20, at + 32]);
  const words = pick(['Liên hệ', 'đặt hàng'], ['Liên hệ', 'đặt', 'hàng']);
  const size = pick(250, 230);
  return (
    <div style={{ position: 'absolute', inset: 0, background: K.blue, color: K.white }}>
      <div style={{ position: 'absolute', left: pad, right: pad, top: pick(80, 110), display: 'flex', justifyContent: 'space-between' }}>
        <Line at={at + 2} style={small(pick(28, 30), K.white)}>QuickTapReview</Line>
        <Line at={at + 4} style={small(pick(28, 30), 'rgba(255,255,255,.75)')}>Freeship Hà Nội</Line>
      </div>

      <div style={{ position: 'absolute', left: pad - 8, top: pick(210, 330) }}>
        {words.map((w, i) => (
          <Line key={w} at={at + 6 + i * 5} style={big(size, K.white)}>{w}</Line>
        ))}
      </div>

      <div
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: strip, background: K.black,
          transform: `translateY(${(1 - stripT) * 100}%)`,
          display: 'flex', flexDirection: portrait ? 'column' : 'row', justifyContent: portrait ? 'center' : 'space-between',
          alignItems: portrait ? 'flex-start' : 'center', padding: `0 ${pad}px`, gap: pick(0, 40),
        }}
      >
        <div style={{ display: 'flex', ...big(pick(150, 132), K.white), letterSpacing: '-0.03em' }}>
          {PHONE.split('').map((ch, i) => (
            <Line key={i} at={at + 26 + i * 1.3} dur={9} style={{ width: ch === ' ' ? '0.28em' : undefined }}>
              {ch === ' ' ? ' ' : ch}
            </Line>
          ))}
        </div>
        <div style={{ textAlign: portrait ? 'left' : 'right' }}>
          <Line at={at + 40} style={small(pick(30, 34), K.white)}>Trả lời trong 2 phút</Line>
          <Line at={at + 43} style={{ ...small(pick(30, 34), 'rgba(255,255,255,.6)'), marginTop: 12 }}>Gọi hoặc nhắn Zalo</Line>
        </div>
      </div>
    </div>
  );
}
