import Link from 'next/link';

export const metadata = {
  title: 'Không tìm thấy trang',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <section className="page-hero" style={{ minHeight: '50vh', display: 'flex', alignItems: 'center' }}>
      <div className="hero-glow" aria-hidden="true" />
      <div className="container" style={{ textAlign: 'center' }}>
        <p className="kicker">404</p>
        <h1>Không tìm thấy trang này</h1>
        <p className="page-hero-sub" style={{ marginInline: 'auto' }}>
          Đường dẫn có thể đã đổi hoặc không còn tồn tại.
        </p>
        <div className="hero-actions" style={{ justifyContent: 'center', marginTop: '1.6rem' }}>
          <Link className="btn btn-primary btn-lg" href="/">Về trang chủ</Link>
        </div>
      </div>
    </section>
  );
}
