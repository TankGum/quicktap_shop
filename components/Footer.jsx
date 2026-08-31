import Link from 'next/link';
import { siteConfig } from '@/lib/siteConfig';
import { NfcWaveIcon, PhoneIcon } from './icons';
import { products } from '@/data/products';
import MetallicText, { inkMetal } from './MetallicText';

// Tham khảo bố cục footer kiểu SaaS hiện đại (thẻ trắng: logo + mô tả bên trái, các cột link
// bên phải, đường kẻ, dòng bản quyền) + chữ thương hiệu khổng lồ phía dưới làm hoạ tiết.
//
// Bản tham khảo có thêm social icon + link Privacy/Terms/Cookies — site này không có mạng xã
// hội nên phần social vẫn bỏ. Các link pháp lý thì nay đã có trang thật (xem app/phap-ly,
// app/chinh-sach-bao-mat, app/dieu-khoan-su-dung, app/so-do-trang) nên được đặt ở hàng dưới
// cùng cạnh dòng bản quyền — đúng chỗ người ta quen tìm, và không chiếm một cột ngang hàng
// với Sản phẩm / Điều hướng trong khi nó không phải nội dung khách vào site để đọc.
//
// 3 cột link ở trên dùng đúng nguồn dữ liệu đã có (data/products.js, các anchor có thật trên
// trang chủ), không phải danh sách gõ tay có thể trôi khỏi thực tế.
const LEGAL_LINKS = [
  { href: '/chinh-sach-bao-mat', label: 'Chính sách quyền riêng tư' },
  { href: '/dieu-khoan-su-dung', label: 'Điều khoản sử dụng' },
  { href: '/phap-ly', label: 'Thông tin pháp lý' },
  { href: '/so-do-trang', label: 'Bản đồ trang web' },
];

const NAV_COLUMN = [
  { href: '/', label: 'Trang chủ' },
  { href: '/#cach-hoat-dong', label: 'Cách hoạt động' },
  { href: '/#loi-ich', label: 'Lợi ích' },
  { href: '/#faq', label: 'Câu hỏi thường gặp' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-top">
          <div className="footer-brand-block">
            <Link className="brand" href="/" aria-label={`${siteConfig.brandName} — về trang chủ`}>
              <span className="brand-mark" aria-hidden="true">
                <NfcWaveIcon />
              </span>
              <span className="brand-name">
                {siteConfig.brandFirst}
                <MetallicText text={siteConfig.brandLast} {...inkMetal} scale={1.8} />
              </span>
            </Link>
            <p className="footer-desc">
              Bảng NFC &amp; standee QR giúp quán tăng đánh giá 5 sao chỉ với 1 chạm.
            </p>
          </div>

          <div className="footer-col">
            <p className="footer-col-title">Sản phẩm</p>
            {products.map((p) => (
              <Link key={p.href} href={p.href}>{p.title}</Link>
            ))}
          </div>

          <div className="footer-col">
            <p className="footer-col-title">Điều hướng</p>
            {NAV_COLUMN.map((l) => (
              <Link key={l.href} href={l.href}>{l.label}</Link>
            ))}
          </div>

          <div className="footer-col">
            <p className="footer-col-title">Liên hệ</p>
            <a href={siteConfig.phoneHref} className="footer-col-phone">
              <PhoneIcon className="i" />
              {siteConfig.phoneDisplay}
            </a>
            <Link href="/lien-he">Liên hệ đặt hàng</Link>
            <span className="footer-col-note">Trả lời trong vòng 2 phút</span>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright">© {year} {siteConfig.brandName}. All rights reserved.</p>
          <nav className="footer-legal" aria-label="Trang pháp lý">
            {LEGAL_LINKS.map((l) => (
              <Link key={l.href} href={l.href}>{l.label}</Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Chữ thương hiệu khổng lồ — vừa là hoạ tiết vừa là link về trang chủ. Bọc riêng 1
          .container (giống cách .hero có 2 .container cạnh nhau) để mép trái thẳng hàng với
          logo phía trên, không bị cuốn vào lưới cột của .footer-top. */}
      <div className="container">
        <Link className="footer-wordmark" href="/" aria-label={`${siteConfig.brandName} — về trang chủ`}>
          <span aria-hidden="true">
            {siteConfig.brandFirst}
            <MetallicText text={siteConfig.brandLast} {...inkMetal} scale={4} />
          </span>
        </Link>
      </div>
    </footer>
  );
}
