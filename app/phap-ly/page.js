import Link from 'next/link';
import Reveal from '@/components/Reveal';
import { siteConfig } from '@/lib/siteConfig';

// Thông tin pháp lý: danh tính đơn vị bán hàng + tuyên bố về nhãn hiệu bên thứ ba.
//
// Danh tính đơn vị lấy từ siteConfig.legal (còn là placeholder cho tới khi điền thông tin đăng
// ký kinh doanh thật). Mục "nhãn hiệu bên thứ ba" là mục BẮT BUỘC phải có với site này: ảnh
// sản phẩm nào cũng có logo Google in trên bảng/standee, không nói rõ thì người xem dễ hiểu
// nhầm đây là dịch vụ do Google cung cấp hoặc bảo trợ.

export const metadata = {
  title: 'Thông tin pháp lý',
  description:
    'Thông tin đơn vị bán hàng, tuyên bố về nhãn hiệu bên thứ ba và bản quyền nội dung website.',
  alternates: { canonical: '/phap-ly' },
  openGraph: {
    url: '/phap-ly',
    title: 'Thông tin pháp lý',
    description: 'Thông tin đơn vị bán hàng, nhãn hiệu bên thứ ba và bản quyền nội dung.',
  },
  twitter: {
    title: 'Thông tin pháp lý',
    description: 'Thông tin đơn vị bán hàng, nhãn hiệu bên thứ ba và bản quyền nội dung.',
  },
};

export default function LegalPage() {
  const { legal, brandName, siteUrl, phoneDisplay, phoneHref, zaloHref } = siteConfig;
  const year = new Date().getFullYear();

  return (
    <>
      <section className="page-hero">
        <div className="hero-glow" aria-hidden="true" />
        <div className="container">
          <Reveal as="p" className="kicker">Pháp lý</Reveal>
          <Reveal as="h1">Thông tin pháp lý</Reveal>
          <Reveal as="p" className="page-hero-sub">
            Ai đứng sau website này, liên hệ ở đâu, và những gì trên trang thuộc về ai.
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <article className="legal-doc">
            <p className="legal-updated">Cập nhật lần cuối: {legal.updatedAt}</p>

            <h2>1. Đơn vị vận hành website</h2>
            <dl className="legal-facts">
              <div>
                <dt>Thương hiệu</dt>
                <dd>{brandName}</dd>
              </div>
              <div>
                <dt>Đơn vị kinh doanh</dt>
                <dd>{legal.companyName}</dd>
              </div>
              <div>
                <dt>Mã số thuế / ĐKKD</dt>
                <dd>{legal.taxCode}</dd>
              </div>
              <div>
                <dt>Địa chỉ</dt>
                <dd>{legal.address}</dd>
              </div>
              <div>
                <dt>Người đại diện</dt>
                <dd>{legal.owner}</dd>
              </div>
              <div>
                <dt>Hotline</dt>
                <dd><a href={phoneHref}>{phoneDisplay}</a></dd>
              </div>
              {legal.email && (
                <div>
                  <dt>Email</dt>
                  <dd><a href={`mailto:${legal.email}`}>{legal.email}</a></dd>
                </div>
              )}
              <div>
                <dt>Website</dt>
                <dd>{siteUrl.replace(/^https?:\/\//, '')}</dd>
              </div>
            </dl>
            <p>
              Kênh liên hệ chính thức là hotline và{' '}
              <a href={zaloHref} target="_blank" rel="noopener noreferrer">Zalo</a> theo số ở
              trên. Chúng tôi không thu tiền qua bất kỳ tài khoản nào khác với tài khoản được
              nhân viên xác nhận trực tiếp với bạn qua điện thoại.
            </p>

            <h2>2. Nhãn hiệu của bên thứ ba</h2>
            <p>
              Google, Google Maps, Facebook, TripAdvisor, Booking.com, Agoda và các tên gọi,
              biểu tượng liên quan là nhãn hiệu thuộc về chủ sở hữu tương ứng. Chúng xuất hiện
              trên ảnh sản phẩm và trong nội dung website chỉ nhằm mô tả nền tảng mà bảng NFC /
              standee sẽ dẫn khách tới.
            </p>
            <p>
              {brandName} là đơn vị độc lập: <b>không</b> phải đối tác chính thức, đại lý, và{' '}
              <b>không</b> được các nền tảng nói trên bảo trợ, chứng nhận hay uỷ quyền. Chúng
              tôi cũng không can thiệp vào thuật toán xếp hạng hay nội dung đánh giá của bất kỳ
              nền tảng nào — sản phẩm chỉ giúp khách của bạn mở trang đánh giá nhanh hơn.
            </p>

            <h2>3. Bản quyền nội dung</h2>
            <p>
              © {year} {brandName}. Ảnh sản phẩm, văn bản, thiết kế giao diện và mã nguồn của
              website thuộc quyền sở hữu của chúng tôi, trừ phần thuộc về bên thứ ba đã nêu ở
              mục 2. Logo do khách hàng cung cấp vẫn thuộc về khách hàng.
            </p>

            <h2>4. Các văn bản khác</h2>
            <ul>
              <li><Link href="/chinh-sach-bao-mat">Chính sách quyền riêng tư</Link> — dữ liệu nào được thu thập, lưu ở đâu, bao lâu.</li>
              <li><Link href="/dieu-khoan-su-dung">Điều khoản sử dụng</Link> — điều kiện dùng website và đặt hàng.</li>
              <li><Link href="/so-do-trang">Bản đồ trang web</Link> — toàn bộ trang đang có.</li>
            </ul>

            <h2>5. Khiếu nại và phản ánh</h2>
            <p>
              Có vấn đề về đơn hàng, nội dung trên website hoặc quyền sở hữu trí tuệ, bạn gọi{' '}
              <a href={phoneHref}>{phoneDisplay}</a> để chúng tôi xử lý. Với khiếu nại về đơn
              hàng, bạn đọc kèm mã đơn (dạng <code>TK-XXXX</code>) để tra cứu nhanh.
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
