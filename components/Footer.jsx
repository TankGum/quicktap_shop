import Link from 'next/link';
import { siteConfig } from '@/lib/siteConfig';
import { NfcWaveIcon } from './icons';

const FOOTER_COLUMNS = [
  {
    title: 'Sản phẩm',
    links: [
      { href: '/san-pham/bang-nfc', label: 'Bảng NFC' },
      { href: '/san-pham/standee', label: 'Standee' },
    ],
  },
  {
    title: 'Điều hướng',
    links: [
      { href: '/', label: 'Trang chủ' },
      { href: '/lien-he', label: 'Liên hệ' },
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-top">
        <Link className="brand footer-brand-mark" href="/" aria-label={`${siteConfig.brandName} — về trang chủ`}>
          <span className="brand-mark" aria-hidden="true">
            <NfcWaveIcon />
          </span>
          <span className="brand-name">
            {siteConfig.brandFirst}<span>{siteConfig.brandLast}</span>
          </span>
        </Link>

        <div className="footer-columns">
          {FOOTER_COLUMNS.map((col) => (
            <div className="footer-col" key={col.title}>
              <p className="footer-col-title">{col.title}</p>
              {col.links.map((l) => (
                <Link key={l.href} href={l.href}>{l.label}</Link>
              ))}
            </div>
          ))}

          <div className="footer-col">
            <p className="footer-col-title">Liên hệ</p>
            <a href={siteConfig.phoneHref}>{siteConfig.phoneDisplay}</a>
            <span className="footer-col-note">Trả lời trong vòng 2 phút</span>
          </div>
        </div>
      </div>

      <div className="container footer-bottom">
        <p className="copyright">© {year} {siteConfig.brandName}. Đã đăng ký bản quyền.</p>
      </div>
    </footer>
  );
}
