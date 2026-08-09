// Icon dạng component — không dùng <use href="#id"> để tránh trùng id khi
// cùng một icon xuất hiện nhiều lần trên một trang.

export function PhoneIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
    </svg>
  );
}

export function MailIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="2.5" y="4.5" width="19" height="15" rx="3" />
      <path d="M3 7l8.1 5.4a1.6 1.6 0 0 0 1.8 0L21 7" />
    </svg>
  );
}

export function MenuIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" {...props}>
      <path d="M4 8h16M4 16h16" />
    </svg>
  );
}

export function CloseIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function ArrowRightIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function CheckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M4.5 12.5l5 5 10-11" />
    </svg>
  );
}

export function ChevronDownIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function StarIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2l3.1 6.6 7.2.9-5.3 4.9 1.4 7.1L12 18l-6.4 3.5 1.4-7.1L1.7 9.5l7.2-.9Z" />
    </svg>
  );
}

export function SearchIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

export function ChatIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.9 8.9 0 0 1-4-.9L3 20.5l1.5-4.5a8.4 8.4 0 0 1-.9-4 8.4 8.4 0 0 1 8.4-8.4h.6A8.4 8.4 0 0 1 21 11v.5Z" />
    </svg>
  );
}

export function TrendUpIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M3 17l5.5-5.5 3.5 3.5L21 6" /><path d="M16 6h5v5" />
    </svg>
  );
}

export function TapIcon(props) {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="14" y="6" width="28" height="46" rx="6" />
      <path d="M50 22a12 12 0 0 1 0 16" /><path d="M56 15a22 22 0 0 1 0 30" />
      <circle cx="28" cy="44" r="2.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function RedirectIcon(props) {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M8 32h38" /><path d="M34 20l12 12-12 12" />
      <path d="M50 10h4a2 2 0 0 1 2 2v40a2 2 0 0 1-2 2h-4" />
    </svg>
  );
}

export function StarBigIcon(props) {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M32 8l7.4 15 16.6 2.4-12 11.7 2.8 16.5L32 45.8 17.2 53.6 20 37.1 8 25.4 24.6 23Z" />
    </svg>
  );
}

export function BarsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M4 19V10M10 19V5M16 19v-6M22 19H2" />
    </svg>
  );
}

export function PinIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" /><circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

export function BoltIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H12Z" />
    </svg>
  );
}

export function PhoneOutlineIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="6" y="2" width="12" height="20" rx="3" /><path d="M10 5.5h4" />
    </svg>
  );
}

export function LayersIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 3v18M3 12h18" /><circle cx="12" cy="12" r="9" />
    </svg>
  );
}

export function RefreshIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M21 12a9 9 0 1 1-3.2-6.9" /><path d="M22 4l-9.5 9.5-3-3" />
    </svg>
  );
}

export function HotelIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M3 21V6.5A1.5 1.5 0 0 1 4.5 5H13v16" /><path d="M13 11h6.5A1.5 1.5 0 0 1 21 12.5V21" />
      <path d="M6.5 9h3M6.5 13h3M6.5 17h3M16.5 15h1.5M16.5 18h1.5" /><path d="M2 21h20" />
    </svg>
  );
}

export function HomestayIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.6V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.6" /><path d="M10 21v-6h4v6" />
    </svg>
  );
}

export function RestaurantIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M6 3v8a3 3 0 0 0 6 0V3" /><path d="M9 11v10" /><path d="M18 3c-1.6 1.6-2.4 3.4-2.4 5.4S16.4 12 18 13v8" />
    </svg>
  );
}

export function CafeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M4 9h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5Z" /><path d="M17 10.5h1.8a2.7 2.7 0 0 1 0 5.4H17" /><path d="M8 3v2.5M12 3v2.5" />
    </svg>
  );
}

export function SpaIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 21c4.5-2.4 7-5.8 7-9.4A4.6 4.6 0 0 0 12 8a4.6 4.6 0 0 0-7 3.6c0 3.6 2.5 7 7 9.4Z" /><path d="M12 8V3" />
    </svg>
  );
}

export function ShopIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M3 7h18l-1.4 12.2a2 2 0 0 1-2 1.8H6.4a2 2 0 0 1-2-1.8Z" /><path d="M8.5 10V6.5a3.5 3.5 0 0 1 7 0V10" />
    </svg>
  );
}

export function NfcWaveIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" {...props}>
      <path d="M6.5 8.5a7 7 0 0 1 0 7" /><path d="M10 6a11 11 0 0 1 0 12" /><path d="M13.5 3.5a15 15 0 0 1 0 17" />
    </svg>
  );
}
