import Link from 'next/link';
import Reveal from '@/components/Reveal';
import { products } from '@/data/products';
import { getVariantsByProduct } from '@/lib/airtable';

// Bản đồ trang web dành cho NGƯỜI đọc. Khác với /sitemap.xml (app/sitemap.js) vốn chỉ dành
// cho máy tìm kiếm — trang này liệt kê cả các khối nội dung trên trang chủ, thứ không bao giờ
// xuất hiện trong sitemap.xml vì chúng chỉ là neo #hash chứ không phải URL riêng.
//
// Danh sách mẫu lấy thẳng từ Airtable như sitemap.xml đang làm, không gõ tay: thêm mẫu mới là
// trang này tự có, không ai phải nhớ quay lại sửa.

export const metadata = {
  title: 'Bản đồ trang web',
  description:
    'Toàn bộ trang và khối nội dung của QuickTapReview: sản phẩm, từng mẫu, thiết kế riêng, liên hệ và các trang pháp lý.',
  alternates: { canonical: '/so-do-trang' },
  openGraph: {
    url: '/so-do-trang',
    title: 'Bản đồ trang web',
    description: 'Toàn bộ trang và khối nội dung của QuickTapReview.',
  },
  twitter: {
    title: 'Bản đồ trang web',
    description: 'Toàn bộ trang và khối nội dung của QuickTapReview.',
  },
};

// Các khối trên trang chủ — cùng danh sách mà header/footer đang dẫn tới.
const HOME_SECTIONS = [
  { href: '/#san-pham', label: 'Sản phẩm' },
  { href: '/#cach-hoat-dong', label: 'Cách hoạt động' },
  { href: '/#dung-that', label: 'Ảnh dùng thật' },
  { href: '/#loi-ich', label: 'Lợi ích' },
  { href: '/#faq', label: 'Câu hỏi thường gặp' },
];

const LEGAL_PAGES = [
  { href: '/chinh-sach-bao-mat', label: 'Chính sách quyền riêng tư' },
  { href: '/dieu-khoan-su-dung', label: 'Điều khoản sử dụng' },
  { href: '/phap-ly', label: 'Thông tin pháp lý' },
];

export default async function SiteMapPage() {
  const variantsByProduct = await getVariantsByProduct();

  return (
    <>
      <section className="page-hero">
        <div className="hero-glow" aria-hidden="true" />
        <div className="container">
          <Reveal as="p" className="kicker">Bản đồ trang web</Reveal>
          <Reveal as="h1">Toàn bộ trang trên website</Reveal>
          <Reveal as="p" className="page-hero-sub">
            Tìm nhanh thứ bạn cần mà không phải lần theo menu.
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="sitemap-grid">
            <section className="sitemap-group">
              <h2>Trang chủ</h2>
              <ul>
                <li><Link href="/">Trang chủ</Link></li>
                {HOME_SECTIONS.map((s) => (
                  <li key={s.href}><Link href={s.href}>{s.label}</Link></li>
                ))}
              </ul>
            </section>

            {products.map((p) => {
              const variants = variantsByProduct[p.id] || [];
              return (
                <section className="sitemap-group" key={p.href}>
                  <h2>{p.title}</h2>
                  <ul>
                    <li><Link href={p.href}>Giới thiệu {p.title}</Link></li>
                    {/* Chưa có mẫu nào trong Airtable thì chỉ còn dòng giới thiệu ở trên —
                        không để một danh sách rỗng nằm trơ ra. */}
                    {variants.map((v) => (
                      <li key={v.href}><Link href={v.href}>{v.name || 'Mẫu'}</Link></li>
                    ))}
                  </ul>
                </section>
              );
            })}

            <section className="sitemap-group">
              <h2>Đặt hàng</h2>
              <ul>
                <li><Link href="/thiet-ke-rieng">Thiết kế riêng — tự xem trước logo trên sản phẩm</Link></li>
                <li><Link href="/lien-he">Liên hệ đặt hàng</Link></li>
              </ul>
            </section>

            <section className="sitemap-group">
              <h2>Pháp lý</h2>
              <ul>
                {LEGAL_PAGES.map((l) => (
                  <li key={l.href}><Link href={l.href}>{l.label}</Link></li>
                ))}
              </ul>
            </section>
          </div>

          {/* Link tới bản XML: dành cho máy tìm kiếm, nhưng để ở đây cho ai cần kiểm tra.
              Dùng <a> chứ không phải <Link>: /sitemap.xml là file do Next sinh ra, không phải
              một route của app router nên điều hướng phía client sẽ không tới được. */}
          <p className="sitemap-note">
            Dành cho công cụ tìm kiếm: <a href="/sitemap.xml">sitemap.xml</a>
          </p>
        </div>
      </section>
    </>
  );
}
