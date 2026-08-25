// Minh hoạ SVG dùng tạm. Xem README để thay bằng ảnh sản phẩm thật.

const STAR_PATH = 'M0-9 2.6-2.9 9-2.4 4.1 1.9 5.6 8.4 0 5 -5.6 8.4 -4.1 1.9 -9-2.4 -2.6-2.9Z';

function StarRow({ x = 0, y = 0, gap = 23, count = 5, size = 1, color = 'var(--accent)' }) {
  const offsets = Array.from({ length: count }, (_, i) => (i - (count - 1) / 2) * gap);
  return (
    <g transform={`translate(${x} ${y})`} fill={color}>
      {offsets.map((dx, i) => (
        <path key={i} d={STAR_PATH} transform={`translate(${dx} 0) scale(${size})`} />
      ))}
    </g>
  );
}

export function NfcPlateArt(props) {
  return (
    <svg viewBox="0 0 400 260" role="img" aria-label="Minh hoạ bảng NFC" {...props}>
      <rect width="400" height="260" fill="var(--art-halo)" />
      <g transform="translate(104 24) rotate(-4 96 96)">
        <defs>
          <linearGradient id="gPlateProduct" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--accent)" /><stop offset="1" stopColor="var(--accent-2)" />
          </linearGradient>
        </defs>
        <rect x="8" y="10" width="192" height="192" rx="20" fill="var(--art-shadow)" opacity=".35" />
        <rect x="0" y="0" width="192" height="192" rx="20" fill="url(#gPlateProduct)" />
        <g fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity=".95" transform="translate(20 34)">
          <path d="M0 16a22 22 0 0 1 0 40" />
          <path d="M16 4a40 40 0 0 1 0 64" />
          <path d="M32 -8a58 58 0 0 1 0 88" />
        </g>
        <g transform="translate(108 108)">
          <rect width="70" height="70" rx="8" fill="#fff" />
          <image href="/assets/img/qr-placeholder.svg" x="3" y="3" width="64" height="64" />
        </g>
      </g>
    </svg>
  );
}

export function StandeeArt(props) {
  return (
    <svg viewBox="0 0 400 260" role="img" aria-label="Minh hoạ standee để bàn" {...props}>
      <rect width="400" height="260" fill="var(--art-halo)" />
      <ellipse cx="200" cy="228" rx="118" ry="16" fill="var(--art-shadow)" opacity=".35" />
      <g transform="translate(128 26)">
        <rect x="0" y="0" width="144" height="176" rx="16" fill="var(--art-card-1)" stroke="var(--art-stroke)" strokeWidth="2" />
        <text x="72" y="30" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--art-ink)">Đánh giá quán nhé!</text>
        <g transform="translate(30 42)">
          <rect width="84" height="84" rx="8" fill="#fff" />
          <image href="/assets/img/qr-placeholder.svg" x="3" y="3" width="78" height="78" />
        </g>
        <StarRow x={72} y={148} gap={18} size={0.72} />
        <path d="M24 176h96v34a8 8 0 0 1-8 8H32a8 8 0 0 1-8-8Z" fill="var(--art-card-2)" stroke="var(--art-stroke)" strokeWidth="2" />
      </g>
    </svg>
  );
}
