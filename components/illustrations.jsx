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

export function HeroArt(props) {
  return (
    <svg viewBox="0 0 520 520" className="art" role="presentation" {...props}>
      <defs>
        <linearGradient id="gTable" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--art-surface-1)" />
          <stop offset="1" stopColor="var(--art-surface-2)" />
        </linearGradient>
        <linearGradient id="gPhone" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--art-phone-1)" />
          <stop offset="1" stopColor="var(--art-phone-2)" />
        </linearGradient>
        <linearGradient id="gCard" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--accent-2)" />
        </linearGradient>
        <linearGradient id="gStand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--art-card-1)" />
          <stop offset="1" stopColor="var(--art-card-2)" />
        </linearGradient>
      </defs>

      <circle cx="260" cy="250" r="228" fill="var(--art-halo)" />

      <path d="M40 392h440v18a10 10 0 0 1-10 10H50a10 10 0 0 1-10-10Z" fill="url(#gTable)" />
      <ellipse cx="260" cy="392" rx="220" ry="26" fill="var(--art-surface-1)" />

      <g>
        <path d="M300 392l26-52h96l-26 52Z" fill="var(--art-shadow)" opacity=".5" />
        <rect x="292" y="120" width="150" height="212" rx="18" fill="url(#gStand)" stroke="var(--art-stroke)" strokeWidth="2" />
        <path d="M320 332h94v46a8 8 0 0 1-8 8h-78a8 8 0 0 1-8-8Z" fill="var(--art-card-2)" stroke="var(--art-stroke)" strokeWidth="2" />
        <text x="367" y="158" textAnchor="middle" fontSize="17" fontWeight="700" fill="var(--art-ink)">Quét để đánh giá</text>
        <g transform="translate(319 172)">
          <rect width="96" height="96" rx="10" fill="#fff" />
          <image href="/assets/img/qr-placeholder.svg" x="4" y="4" width="88" height="88" />
        </g>
        <StarRow x={367} y={292} gap={23} />
      </g>

      <g transform="translate(78 322) rotate(-8)">
        <rect x="0" y="0" width="150" height="94" rx="14" fill="url(#gCard)" />
        <g fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" opacity=".92">
          <path d="M40 36a18 18 0 0 1 0 22" />
          <path d="M52 28a30 30 0 0 1 0 38" />
          <path d="M64 20a42 42 0 0 1 0 54" />
        </g>
        <rect x="86" y="38" width="44" height="7" rx="3.5" fill="#fff" opacity=".92" />
        <rect x="86" y="53" width="30" height="7" rx="3.5" fill="#fff" opacity=".55" />
      </g>

      <g transform="translate(112 96) rotate(-8)">
        <rect x="8" y="10" width="176" height="290" rx="30" fill="var(--art-shadow)" opacity=".45" />
        <rect x="0" y="0" width="176" height="290" rx="30" fill="url(#gPhone)" stroke="var(--art-stroke)" strokeWidth="2" />
        <rect x="10" y="10" width="156" height="270" rx="22" fill="var(--art-screen)" />
        <rect x="66" y="18" width="44" height="9" rx="4.5" fill="var(--art-phone-1)" />

        <rect x="26" y="48" width="80" height="9" rx="4.5" fill="var(--art-ink)" opacity=".85" />
        <rect x="26" y="66" width="52" height="8" rx="4" fill="var(--art-ink)" opacity=".35" />

        <StarRow x={88} y={112} gap={26} size={0.72} color="var(--star)" />

        <rect x="26" y="142" width="124" height="8" rx="4" fill="var(--art-ink)" opacity=".22" />
        <rect x="26" y="158" width="104" height="8" rx="4" fill="var(--art-ink)" opacity=".22" />
        <rect x="26" y="174" width="116" height="8" rx="4" fill="var(--art-ink)" opacity=".22" />

        <rect x="26" y="212" width="124" height="34" rx="17" fill="var(--accent)" />
        <rect x="52" y="225" width="72" height="8" rx="4" fill="#fff" opacity=".95" />
      </g>

      <g className="waves" stroke="var(--accent)" fill="none" strokeWidth="4" strokeLinecap="round">
        <path className="w1" d="M182 330a26 26 0 0 0 0-34" />
        <path className="w2" d="M198 344a48 48 0 0 0 0-62" />
        <path className="w3" d="M214 358a70 70 0 0 0 0-90" />
      </g>
    </svg>
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
