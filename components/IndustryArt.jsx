// Minh hoạ phẳng kiểu hoạt hình cho mục "Phù hợp với" ở trang chủ — thay cho ảnh chụp thật
// (Unsplash) trước đây. Vẽ thẳng bằng SVG nên không tải ảnh nào, sắc nét ở mọi cỡ màn hình và
// cùng một ngôn ngữ hình khối: nền pastel riêng cho từng ngành, khối bo tròn, không viền.
//
// Cảnh nào cũng có một chiếc standee đánh giá nhỏ (<MiniStandee>) — sợi chỉ nối các ngành với
// đúng sản phẩm đang bán.
//
// Khung vẽ 400×300 (4:3), khớp tỉ lệ ô .industry-media trong globals.css.

const INK = '#1d1d1f';
const STAR = '#ffc531';

// Standee chữ A nhỏ: thân trắng, chấm "G" xanh, hàng 5 sao. (x, y) là điểm giữa CHÂN standee.
function MiniStandee({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="2" rx="30" ry="5" fill="#000" opacity=".12" />
      <path d="M-22 0 L-16 -64 H16 L22 0 Z" fill="#fff" />
      <path d="M16 -64 L22 0 H26 L19 -64 Z" fill="#dfe3ea" />
      <circle cx="0" cy="-42" r="10" fill="#4285f4" />
      <text x="0" y="-37.5" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">G</text>
      <g fill={STAR}>
        {[-12, -6, 0, 6, 12].map((dx) => <circle key={dx} cx={dx} cy="-20" r="2.4" />)}
      </g>
      <rect x="-11" y="-12" width="22" height="3" rx="1.5" fill="#e6e8ee" />
    </g>
  );
}

function Hotel() {
  const windows = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      const lit = (r * 4 + c) % 3 === 1;
      windows.push(
        <rect key={`${r}${c}`} x={128 + c * 38} y={96 + r * 34} width="26" height="22" rx="4" fill={lit ? '#ffe17a' : '#cfe0ff'} />
      );
    }
  }
  return (
    <>
      <rect width="400" height="300" fill="#dbe8ff" />
      <circle cx="330" cy="62" r="30" fill="#fff" opacity=".7" />
      <rect y="250" width="400" height="50" fill="#c3d6fb" />
      {/* Toà nhà */}
      <rect x="112" y="78" width="176" height="172" rx="10" fill="#4a80e8" />
      <rect x="102" y="66" width="196" height="20" rx="6" fill="#2f62c9" />
      <rect x="158" y="40" width="84" height="26" rx="7" fill="#ffd43b" />
      <text x="200" y="58" textAnchor="middle" fontSize="15" fontWeight="800" letterSpacing="2" fill={INK}>HOTEL</text>
      {windows}
      {/* Cửa + mái hiên */}
      <rect x="178" y="204" width="44" height="46" rx="6" fill={INK} />
      <path d="M168 204 H232 L224 192 H176 Z" fill="#ff7657" />
      <rect x="198" y="210" width="4" height="34" rx="2" fill="#4a80e8" />
      {/* Bụi cây */}
      <circle cx="122" cy="246" r="16" fill="#34c27a" />
      <circle cx="142" cy="250" r="12" fill="#2aa968" />
      <circle cx="266" cy="248" r="14" fill="#34c27a" />
      <MiniStandee x={330} y={268} />
    </>
  );
}

function Homestay() {
  return (
    <>
      <rect width="400" height="300" fill="#ffe8d6" />
      <path d="M0 210 Q90 150 190 200 T400 180 V300 H0 Z" fill="#c9eccf" />
      <rect y="250" width="400" height="50" fill="#f6cfae" />
      {/* Cây */}
      <rect x="66" y="190" width="10" height="60" rx="4" fill="#9a6a45" />
      <circle cx="71" cy="176" r="30" fill="#34c27a" />
      <circle cx="90" cy="194" r="20" fill="#2aa968" />
      {/* Nhà */}
      <rect x="236" y="70" width="20" height="44" rx="3" fill="#c4553f" />
      <rect x="128" y="138" width="164" height="112" rx="6" fill="#fff6ec" />
      <path d="M112 146 L210 74 L308 146 Z" fill="#ff7657" />
      <path d="M112 146 L210 74 L308 146 L298 150 L210 86 L122 150 Z" fill="#e85d40" />
      <circle cx="210" cy="118" r="12" fill="#ffe17a" />
      <path d="M188 250 V210 a22 22 0 0 1 44 0 V250 Z" fill="#9a6a45" />
      <circle cx="223" cy="230" r="3" fill="#ffd43b" />
      {[146, 252].map((x) => (
        <g key={x}>
          <rect x={x} y="168" width="26" height="26" rx="4" fill="#9fd3ff" />
          <path d={`M${x + 13} 168 V194 M${x} 181 H${x + 26}`} stroke="#fff6ec" strokeWidth="3" />
        </g>
      ))}
      {/* Chậu hoa */}
      <path d="M150 250 L154 232 H172 L176 250 Z" fill="#e85d40" />
      <circle cx="158" cy="226" r="7" fill="#ff9cbc" />
      <circle cx="168" cy="224" r="7" fill="#ffd43b" />
      <MiniStandee x={338} y={270} />
    </>
  );
}

function Restaurant() {
  return (
    <>
      <rect width="400" height="300" fill="#fff1c7" />
      <defs>
        <pattern id="ind-check" width="28" height="28" patternUnits="userSpaceOnUse">
          <rect width="28" height="28" fill="#ff7657" />
          <rect width="14" height="14" fill="#fff" opacity=".28" />
          <rect x="14" y="14" width="14" height="14" fill="#fff" opacity=".28" />
        </pattern>
      </defs>
      <rect y="206" width="400" height="94" fill="url(#ind-check)" />
      {/* Dao nĩa */}
      <rect x="70" y="176" width="7" height="70" rx="3.5" fill="#8a929c" />
      <path d="M64 150 v28 a9.5 9.5 0 0 0 19 0 v-28" fill="none" stroke="#8a929c" strokeWidth="5" strokeLinecap="round" />
      <path d="M73.5 150 v22" stroke="#8a929c" strokeWidth="4" strokeLinecap="round" />
      <path d="M318 150 c14 6 14 40 0 50 v46" fill="none" stroke="#8a929c" strokeWidth="9" strokeLinecap="round" />
      {/* Đĩa + nắp chuông */}
      <ellipse cx="196" cy="210" rx="104" ry="24" fill="#000" opacity=".1" />
      <ellipse cx="196" cy="204" rx="104" ry="24" fill="#fff" />
      <path d="M116 200 a80 80 0 0 1 160 0 Z" fill="#d7dee7" />
      <path d="M134 186 a64 64 0 0 1 46 -50" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" opacity=".8" />
      <rect x="110" y="196" width="172" height="10" rx="5" fill="#b9c3cf" />
      <circle cx="196" cy="112" r="9" fill="#b9c3cf" />
      {/* Lấp lánh */}
      <path d="M268 92 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4 Z" fill="#fff" />
      <MiniStandee x={350} y={226} s={.9} />
    </>
  );
}

function Cafe() {
  return (
    <>
      <rect width="400" height="300" fill="#efe1d1" />
      <rect y="232" width="400" height="68" fill="#c99b74" />
      <rect y="232" width="400" height="8" fill="#b4855f" />
      {/* Hơi nóng */}
      {[164, 192, 220].map((x, i) => (
        <path key={x} d={`M${x} ${100 - i * 4} c-10 -12 10 -20 0 -34 c-8 -11 6 -18 2 -26`} fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity=".85" />
      ))}
      {/* Đĩa lót + cốc */}
      <ellipse cx="192" cy="234" rx="86" ry="15" fill="#fff" />
      <ellipse cx="192" cy="230" rx="60" ry="9" fill="#ece6df" />
      <path d="M252 148 a26 26 0 0 1 0 52" fill="none" stroke="#fff" strokeWidth="13" />
      <path d="M126 130 H258 L250 204 a26 26 0 0 1 -26 24 H160 a26 26 0 0 1 -26 -24 Z" fill="#fff" />
      <ellipse cx="192" cy="131" rx="66" ry="12" fill="#7a4a2c" />
      <path d="M192 140 c-12 -10 -4 -18 0 -10 c4 -8 12 0 0 10 Z" fill="#f3dcc4" />
      <rect x="150" y="160" width="84" height="8" rx="4" fill="#4a80e8" opacity=".85" />
      {/* Bánh donut */}
      <ellipse cx="78" cy="236" rx="40" ry="10" fill="#000" opacity=".1" />
      <circle cx="78" cy="214" r="30" fill="#f5b82e" />
      <path d="M52 206 a28 26 0 0 1 52 0 c-6 8 -10 2 -16 8 c-6 -6 -10 2 -18 -4 c-6 6 -12 2 -18 -4 Z" fill="#ff9cbc" />
      <circle cx="78" cy="212" r="9" fill="#efe1d1" />
      {[[64, 200, '#fff'], [92, 198, '#4a80e8'], [84, 222, '#34c27a']].map(([cx, cy, f]) => (
        <rect key={`${cx}${cy}`} x={cx} y={cy} width="7" height="3" rx="1.5" fill={f} transform={`rotate(30 ${cx} ${cy})`} />
      ))}
      <MiniStandee x={336} y={248} />
    </>
  );
}

function Spa() {
  return (
    <>
      <rect width="400" height="300" fill="#dcf3e7" />
      {/* Lá lớn ở góc */}
      <path d="M0 40 C70 30 120 90 110 160 C50 150 10 110 0 40 Z" fill="#9edfbd" />
      <path d="M0 40 C40 80 70 110 110 160" stroke="#7fd1a4" strokeWidth="3" fill="none" />
      <path d="M400 70 C330 70 290 130 300 190 C360 180 395 130 400 70 Z" fill="#b6e8cd" />
      <ellipse cx="200" cy="262" rx="190" ry="34" fill="#c2ead5" />
      {/* Chồng đá */}
      <ellipse cx="190" cy="244" rx="70" ry="22" fill="#8f9aa4" />
      <ellipse cx="190" cy="210" rx="56" ry="18" fill="#a8b2ba" />
      <ellipse cx="190" cy="180" rx="42" ry="14" fill="#c2cad0" />
      <ellipse cx="190" cy="156" rx="28" ry="10" fill="#d8dee2" />
      {/* Hoa sen */}
      <g transform="translate(190 140)">
        <path d="M0 0 C-10 -14 -8 -30 0 -38 C8 -30 10 -14 0 0 Z" fill="#ff9cbc" />
        <path d="M0 0 C-18 -6 -28 -20 -26 -32 C-14 -28 -4 -16 0 0 Z" fill="#ff7fa8" />
        <path d="M0 0 C18 -6 28 -20 26 -32 C14 -28 4 -16 0 0 Z" fill="#ff7fa8" />
      </g>
      {/* Nến */}
      <rect x="276" y="214" width="26" height="40" rx="5" fill="#fff6ec" />
      <path d="M289 214 v-6" stroke={INK} strokeWidth="2" />
      <path d="M289 186 c8 10 6 20 0 22 c-6 -2 -8 -12 0 -22 Z" fill="#ffb02e" />
      <MiniStandee x={92} y={262} s={.95} />
    </>
  );
}

function Shop() {
  const stripes = Array.from({ length: 8 }, (_, i) => i);
  return (
    <>
      <rect width="400" height="300" fill="#efe7ff" />
      <rect y="252" width="400" height="48" fill="#ddd0fb" />
      {/* Mặt tiền */}
      <rect x="104" y="96" width="196" height="156" rx="6" fill="#fff" />
      <rect x="140" y="42" width="124" height="30" rx="8" fill={INK} />
      <text x="202" y="63" textAnchor="middle" fontSize="15" fontWeight="800" letterSpacing="3" fill="#fff">SHOP</text>
      {/* Mái hiên sọc + mép lượn */}
      {stripes.map((i) => (
        <rect key={i} x={94 + i * 27} y="80" width="27" height="34" fill={i % 2 ? '#f1ecff' : '#7b62e8'} />
      ))}
      {stripes.map((i) => (
        <path key={i} d={`M${94 + i * 27} 114 a13.5 13.5 0 0 0 27 0 Z`} fill={i % 2 ? '#f1ecff' : '#7b62e8'} />
      ))}
      {/* Tủ kính trưng bày */}
      <rect x="120" y="146" width="96" height="78" rx="6" fill="#dcd3ff" />
      <rect x="132" y="180" width="22" height="44" rx="4" fill="#ff9cbc" />
      <rect x="160" y="168" width="20" height="56" rx="4" fill="#ffd43b" />
      <circle cx="198" cy="210" r="13" fill="#34c27a" />
      <path d="M126 154 L150 154 L132 176 Z" fill="#fff" opacity=".6" />
      {/* Cửa */}
      <rect x="232" y="146" width="52" height="106" rx="6" fill="#5a43c9" />
      <rect x="240" y="156" width="36" height="46" rx="4" fill="#9f8cf0" />
      <circle cx="274" cy="214" r="3.5" fill="#ffd43b" />
      {/* Túi mua sắm */}
      <path d="M56 214 a14 14 0 0 1 28 0" fill="none" stroke="#e8a500" strokeWidth="5" />
      <rect x="44" y="212" width="52" height="54" rx="6" fill="#ffd43b" />
      <MiniStandee x={340} y={272} />
    </>
  );
}

const SCENES = {
  hotel: Hotel,
  homestay: Homestay,
  restaurant: Restaurant,
  cafe: Cafe,
  spa: Spa,
  shop: Shop,
};

export default function IndustryArt({ id, ...props }) {
  const Scene = SCENES[id];
  if (!Scene) return null;
  return (
    <svg viewBox="0 0 400 300" aria-hidden="true" focusable="false" {...props}>
      <Scene />
    </svg>
  );
}
