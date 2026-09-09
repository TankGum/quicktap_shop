import Reveal from '@/components/Reveal';
import CheckoutView from '@/components/CheckoutView';
import { siteConfig } from '@/lib/siteConfig';

// Trang giỏ hàng KHÔNG cho đánh chỉ mục: nội dung của nó phụ thuộc hoàn toàn vào localStorage
// của từng người, nên với con bọ tìm kiếm nó luôn là một trang trống. Để Google thu thập chỉ
// tổ thêm một trang rỗng vào chỉ mục của site.
export const metadata = {
  title: 'Giỏ hàng',
  description: 'Giỏ hàng và đặt bảng NFC, standee QR đánh giá Google Maps.',
  alternates: { canonical: '/gio-hang' },
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return (
    <>
      <section className="page-hero page-hero-tight">
        <div className="hero-glow" aria-hidden="true" />
        <div className="container">
          <Reveal as="p" className="kicker">Giỏ hàng</Reveal>
          <Reveal as="h1">Xem lại đơn rồi đặt</Reveal>
          <Reveal as="p" className="page-hero-sub">
            {siteConfig.shippingPolicy}
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <CheckoutView />
        </div>
      </section>
    </>
  );
}
