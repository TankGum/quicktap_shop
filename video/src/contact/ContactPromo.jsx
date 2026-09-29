import { AbsoluteFill, Sequence } from 'remotion';
import { fontFamily } from '../theme';
import { K, Panel, TOTAL } from './kit';
import { EndCard } from './EndCard';
import { Channel, Done, JustTwo, Ready, RestOnUs, TwoMinutes } from './scenes';

export const CONTACT_DURATION = TOTAL;

// Mỗi Sequence là một tấm màu quét phủ lên tấm trước. Tấm đầu (khối chốt đã dựng xong) và tấm
// cuối (khối chốt dựng lại) cho ra khung cuối trùng khung đầu → video lặp liền mạch.
// `el` là HÀM trả JSX, không phải JSX viết thẳng ở cấp module (bundler của Remotion chạy
// module trước khi React sẵn sàng — xem ghi chú tương tự ở ICONS trong src/ui.jsx).
const SHOTS = [
  { from: 0, dur: 42, bg: K.blue, dir: null, el: () => <EndCard /> },
  { from: 32, dur: 58, bg: K.black, dir: 'right', el: () => <Ready /> },
  { from: 84, dur: 26, bg: K.white, dir: 'bottom', el: () => <Channel words={['Gọi.']} color={K.black} caption="Liên hệ theo cách bạn thích" /> },
  { from: 104, dur: 26, bg: K.blue, dir: 'left', el: () => <Channel words={['Nhắn', 'Zalo.']} color={K.white} caption="Liên hệ theo cách bạn thích" /> },
  { from: 124, dur: 28, bg: K.black, dir: 'top', el: () => <Channel words={['Chat', '24/7.']} color={K.white} caption="Liên hệ theo cách bạn thích" /> },
  { from: 146, dur: 60, bg: K.white, dir: 'right', el: () => <JustTwo /> },
  { from: 200, dur: 42, bg: K.blue, dir: 'bottom', el: () => <Done /> },
  { from: 236, dur: 66, bg: K.black, dir: 'left', el: () => <TwoMinutes /> },
  { from: 296, dur: 70, bg: K.white, dir: 'right', el: () => <RestOnUs /> },
  { from: 360, dur: 90, bg: K.blue, dir: 'bottom', el: () => <EndCard at={6} /> },
];

export function ContactPromo() {
  return (
    <AbsoluteFill style={{ fontFamily, background: K.blue }}>
      {SHOTS.map((s, i) => (
        <Sequence key={i} from={s.from} durationInFrames={s.dur}>
          {s.dir ? <Panel bg={s.bg} from={s.dir}>{s.el()}</Panel> : <AbsoluteFill style={{ background: s.bg }}>{s.el()}</AbsoluteFill>}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
