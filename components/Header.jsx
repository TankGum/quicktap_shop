'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { siteConfig } from '@/lib/siteConfig';
import { PhoneIcon, NfcWaveIcon, MenuIcon, CloseIcon } from './icons';

const NAV_LINKS = [
  { href: '/san-pham/bang-nfc', label: 'Bảng NFC' },
  { href: '/san-pham/standee', label: 'Standee' },
  { href: '/lien-he', label: 'Liên hệ' },
];

// Sidebar mobile có thêm mục Trang chủ ở đầu — logo trong header cũng dẫn về "/",
// nhưng khi sidebar mở thì nó phủ lên cả header (z-index cao hơn) nên logo bị che,
// không bấm được. Nav desktop thì không cần vì logo luôn lộ ra, thêm vào sẽ bị trùng.
const MOBILE_NAV_LINKS = [{ href: '/', label: 'Trang chủ' }, ...NAV_LINKS];

export default function Header() {
  const [stuck, setStuck] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Mục đang xem: khớp chính xác, hoặc đang ở trang con của nó (vd trang chi tiết
  // một mẫu /san-pham/standee/standee-google-map-... vẫn tính là đang ở "Standee").
  const isActive = (href) => pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Đổi trang thì đóng menu — nếu không, bấm một link xong menu vẫn nằm đè lên trang mới.
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    // Khoá cuộn nền để chỉ cuộn được trong menu.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKeyDown);

    // Màn hình xoay ngang / phóng to qua ngưỡng desktop thì menu mobile không còn nghĩa.
    const mq = window.matchMedia('(min-width: 860px)');
    const onChange = (e) => { if (e.matches) setMenuOpen(false); };
    mq.addEventListener('change', onChange);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
      mq.removeEventListener('change', onChange);
    };
  }, [menuOpen]);

  return (
    // Fragment chứ không bọc tất cả trong <header>: .site-header có backdrop-filter, mà phần
    // tử có backdrop-filter trở thành khối chứa cho con `position: fixed`. Nếu để lớp nền mờ
    // và menu trượt bên trong header, chúng sẽ bị nhốt trong khung header cao ~52px —
    // menu chỉ hiện một mẩu và nền mờ không phủ được trang.
    <>
      <header className={`site-header${stuck ? ' is-stuck' : ''}`} id="siteHeader">
      <div className="container header-inner">
        <Link className="brand" href="/" aria-label={`${siteConfig.brandName} — về trang chủ`}>
          <span className="brand-mark" aria-hidden="true">
            <NfcWaveIcon />
          </span>
          <span className="brand-name">
            {siteConfig.brandFirst}<span>{siteConfig.brandLast}</span>
          </span>
        </Link>

        <nav className="site-nav" aria-label="Điều hướng chính">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? 'page' : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <a className="btn btn-primary btn-sm header-cta" href={siteConfig.phoneHref}>
          <PhoneIcon className="i" />
          Đặt hàng
        </a>

        <button
          type="button"
          className="nav-toggle"
          aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
          aria-expanded={menuOpen}
          aria-controls="mobileMenu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <MenuIcon />
        </button>
        </div>
      </header>

      {/* Lớp nền mờ — bấm ra ngoài để đóng. */}
      <div
        className={`nav-scrim${menuOpen ? ' is-open' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      <nav
        id="mobileMenu"
        className={`mobile-nav${menuOpen ? ' is-open' : ''}`}
        aria-label="Điều hướng trên điện thoại"
        // Khi đóng thì ẩn hẳn khỏi trình đọc màn hình và thứ tự tab, tránh việc
        // người dùng bàn phím tab vào các link vô hình nằm ngoài màn hình.
        inert={!menuOpen}
      >
        {/* Nút đóng nằm TRONG sidebar: sidebar phủ lên cả header nên nút trên header
            sẽ bị che, không bấm được. */}
        <div className="mobile-nav-head">
          <button
            type="button"
            className="nav-toggle mobile-nav-close"
            aria-label="Đóng menu"
            onClick={() => setMenuOpen(false)}
          >
            <CloseIcon />
          </button>
        </div>

        <ul className="mobile-nav-list">
          {MOBILE_NAV_LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={isActive(l.href) ? 'page' : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <a className="btn btn-primary btn-lg mobile-nav-cta" href={siteConfig.phoneHref}>
          <PhoneIcon className="i" />
          Gọi {siteConfig.phoneDisplay}
        </a>
        <p className="mobile-nav-note">Trả lời trong vòng 2 phút · Đặt 1 cái cũng nhận</p>
      </nav>
    </>
  );
}
