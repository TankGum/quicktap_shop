import { K, Line, Slam, big, ease, small, useDir } from './kit';
import { useCurrentFrame } from 'remotion';

const Caption = ({ children, color }) => {
  const { pick } = useDir();
  return (
    <div style={{ position: 'absolute', left: pick(100, 72), top: pick(80, 110) }}>
      <Line at={4} style={small(pick(28, 30), color)}>{children}</Line>
    </div>
  );
};

// Khối chữ canh trái, căn giữa theo chiều dọc.
const Stack = ({ children, top }) => {
  const { pick } = useDir();
  return (
    <div
      style={{
        position: 'absolute', left: pick(92, 64), right: pick(92, 64),
        top: top ?? 0, bottom: top != null ? undefined : 0,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}
    >
      {children}
    </div>
  );
};

export function Ready() {
  const { pick } = useDir();
  const s = pick(300, 260);
  const lines = pick([['Sẵn sàng', K.white], ['chưa?', K.blue]], [['Sẵn', K.white], ['sàng', K.white], ['chưa?', K.blue]]);
  return (
    <Stack>
      {lines.map(([w, c], i) => <Line key={w} at={6 + i * 5} style={big(s, c)}>{w}</Line>)}
    </Stack>
  );
}

// Ba nhát cắt kênh liên hệ.
export function Channel({ words, color, caption }) {
  const { pick } = useDir();
  const s = pick(words.length > 1 ? 380 : 540, words.length > 1 ? 300 : 440);
  return (
    <>
      <Caption color={color}>{caption}</Caption>
      <Stack>
        {words.map((w, i) => <Slam key={w} at={3 + i * 3} style={big(s, color)}>{w}</Slam>)}
      </Stack>
    </>
  );
}

export function JustTwo() {
  const f = useCurrentFrame();
  const { pick } = useDir();
  const bar = (at, from) => ease(f, [at, at + 10]) * (from === 'left' ? 1 : -1);
  const barH = pick(250, 230);
  const tS = pick(185, 124);
  const bars = [
    { txt: 'Tên quán', bg: K.blue, at: 20, from: 'left' },
    { txt: '& Địa chỉ', bg: K.black, at: 28, from: 'right' },
  ];
  return (
    <>
      <div style={{ position: 'absolute', left: pick(92, 64), top: pick(110, 260) }}>
        {pick(['Chỉ cần'], ['Chỉ', 'cần']).map((w, i) => (
          <Line key={w} at={6 + i * 4} style={big(pick(260, 280), K.black)}>{w}</Line>
        ))}
      </div>
      {bars.map((b, i) => {
        const t = Math.abs(bar(b.at, b.from));
        return (
          <div
            key={b.txt}
            style={{
              position: 'absolute', left: 0, right: 0, top: pick(450, 1000) + i * (barH + 24), height: barH,
              background: b.bg, display: 'flex', alignItems: 'center', padding: `0 ${pick(92, 64)}px`,
              transform: `translateX(${(1 - t) * (b.from === 'left' ? -100 : 100)}%)`,
            }}
          >
            <span style={big(tS, K.white)}>{b.txt}</span>
          </div>
        );
      })}
    </>
  );
}

export function Done() {
  const { pick } = useDir();
  return (
    <Stack>
      {['Là', 'xong.'].map((w, i) => <Slam key={w} at={3 + i * 4} style={big(pick(400, 300), K.white)}>{w}</Slam>)}
    </Stack>
  );
}

export function TwoMinutes() {
  const { pick, portrait } = useDir();
  return (
    <>
      <Caption color={K.white}>Trả lời trong vòng</Caption>
      <div
        style={{
          position: 'absolute', left: pick(70, 40), right: pick(100, 64), top: 0, bottom: 0,
          display: 'flex', flexDirection: portrait ? 'column' : 'row', alignItems: portrait ? 'flex-start' : 'flex-end',
          justifyContent: 'center', gap: pick(40, 0), paddingBottom: pick(150, 0),
        }}
      >
        <Slam at={4} style={{ ...big(pick(860, 980), K.blue), lineHeight: 0.8 }}>2</Slam>
        <Line at={12} style={{ ...big(pick(300, 300), K.white), paddingBottom: pick(30, 0) }}>phút</Line>
      </div>
    </>
  );
}

export function RestOnUs() {
  const { pick } = useDir();
  const s = pick(172, 176);
  const lines = pick(
    [['Phần còn lại', K.black], ['để chúng', K.blue], ['tôi lo.', K.blue]],
    [['Phần', K.black], ['còn lại', K.black], ['để chúng', K.blue], ['tôi lo.', K.blue]],
  );
  return (
    <>
      <div style={{ position: 'absolute', left: pick(92, 64), top: pick(120, 300) }}>
        {lines.map(([w, c], i) => <Line key={w} at={6 + i * 4} style={big(s, c)}>{w}</Line>)}
      </div>
      <div
        style={{
          position: 'absolute', left: pick(100, 72), right: pick(100, 72), bottom: pick(90, 200),
          borderTop: `3px solid ${K.black}`, paddingTop: 26,
        }}
      >
        <Line at={26} style={small(pick(34, 34), K.black)}>
          {pick('Lên mẫu — In ấn — Giao tận nơi', 'Lên mẫu — In ấn — Giao tận nơi')}
        </Line>
      </div>
    </>
  );
}
