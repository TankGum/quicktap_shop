import Link from 'next/link';
import Reveal from '@/components/Reveal';
import { siteConfig } from '@/lib/siteConfig';

// Điều khoản sử dụng website + điều kiện đặt hàng.
//
// Hai mục bám sát code thật, sửa code thì phải sửa theo: mục "Nội dung bạn tải lên" (khách
// tải logo ở components/DesignStudio.jsx, ảnh mẫu được dùng để lên bản in) và mục "Sử dụng
// hợp lệ" (hạn mức chống spam đang đặt trong functions/api/thiet-ke-rieng.js).

export const metadata = {
  title: 'Điều khoản sử dụng',
  description:
    'Điều kiện sử dụng website, cách đặt hàng và xác nhận đơn, quyền với logo bạn tải lên, và giới hạn trách nhiệm.',
  alternates: { canonical: '/dieu-khoan-su-dung' },
  openGraph: {
    url: '/dieu-khoan-su-dung',
    title: 'Điều khoản sử dụng',
    description: 'Điều kiện sử dụng website, cách đặt hàng và xác nhận đơn, giới hạn trách nhiệm.',
  },
  twitter: {
    title: 'Điều khoản sử dụng',
    description: 'Điều kiện sử dụng website, cách đặt hàng và xác nhận đơn, giới hạn trách nhiệm.',
  },
};

export default function TermsPage() {
  const { legal, brandName, phoneDisplay, phoneHref } = siteConfig;

  return (
    <>
      <section className="page-hero">
        <div className="hero-glow" aria-hidden="true" />
        <div className="container">
          <Reveal as="p" className="kicker">Pháp lý</Reveal>
          <Reveal as="h1">Điều khoản sử dụng</Reveal>
          <Reveal as="p" className="page-hero-sub">
            Những điều kiện khi bạn dùng website và đặt hàng tại {brandName}.
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <article className="legal-doc">
            <p className="legal-updated">Cập nhật lần cuối: {legal.updatedAt}</p>

            <h2>1. Chấp nhận điều khoản</h2>
            <p>
              Khi truy cập website hoặc gửi đơn qua website, bạn đồng ý với các điều khoản dưới
              đây. Nếu không đồng ý, bạn vui lòng không sử dụng website và có thể đặt hàng trực
              tiếp qua hotline.
            </p>

            <h2>2. Dịch vụ chúng tôi cung cấp</h2>
            <p>
              {brandName} sản xuất và cung cấp bảng NFC, standee QR dẫn khách tới trang đánh giá
              của quán. Website đóng vai trò giới thiệu sản phẩm, cho bạn tự xem trước mẫu và
              gửi yêu cầu đặt hàng.
            </p>

            <h2>3. Đặt hàng và xác nhận</h2>
            <ul>
              <li>
                Yêu cầu bạn gửi trên website là <b>đề nghị đặt hàng</b>, chưa phải hợp đồng.
              </li>
              <li>
                Đơn được xác lập khi hai bên xác nhận qua điện thoại về mẫu, số lượng, giá và
                địa chỉ giao hàng.
              </li>
              <li>
                Giá và thời gian giao hàng được báo tại thời điểm xác nhận. Chúng tôi có quyền
                từ chối hoặc huỷ đơn nếu thông tin không liên hệ được, mẫu không thể sản xuất,
                hoặc nghi ngờ đơn giả mạo.
              </li>
              <li>
                Sản phẩm in theo yêu cầu riêng (logo của quán) là hàng đặt làm riêng — mọi thay
                đổi cần báo trước khi chúng tôi chuyển sang khâu in.
              </li>
            </ul>

            <h2>4. Nội dung bạn tải lên</h2>
            <p>
              Khi tải logo lên công cụ <Link href="/thiet-ke-rieng">Thiết kế riêng</Link>, bạn
              cam kết mình có quyền sử dụng hình ảnh đó và việc in nó lên sản phẩm không xâm
              phạm quyền của bên thứ ba.
            </p>
            <p>
              Bạn cho phép chúng tôi sử dụng logo và ảnh mẫu đã chốt trong phạm vi cần thiết để
              dựng bản in, sản xuất và giao hàng cho chính đơn của bạn. Chúng tôi{' '}
              <b>không</b> dùng logo của bạn cho quảng cáo hay làm ảnh minh hoạ nếu chưa được
              bạn đồng ý.
            </p>
            <p>
              Chúng tôi có quyền từ chối các nội dung vi phạm pháp luật, xâm phạm quyền sở hữu
              trí tuệ, hoặc mang tính xúc phạm.
            </p>

            <h2>5. Sử dụng hợp lệ</h2>
            <p>
              Bạn không được dùng công cụ tự động để gửi đơn hàng loạt, dò quét hoặc gây quá tải
              hệ thống. Hệ thống nhận đơn có giới hạn số lần gửi theo địa chỉ IP; vượt giới hạn,
              bạn sẽ tạm thời không gửi được và có thể đặt hàng qua hotline.
            </p>

            <h2>6. Sở hữu trí tuệ</h2>
            <p>
              Toàn bộ nội dung website (thiết kế giao diện, hình ảnh sản phẩm, văn bản, mã
              nguồn) thuộc về {brandName}, trừ phần thuộc về bên thứ ba. Bạn không được sao chép
              hoặc sử dụng lại cho mục đích thương mại nếu chưa có sự đồng ý bằng văn bản.
            </p>

            <h2>7. Nhãn hiệu của bên thứ ba</h2>
            <p>
              Google, Google Maps và các nhãn hiệu khác xuất hiện trên ảnh sản phẩm thuộc về chủ
              sở hữu tương ứng. {brandName} không phải là đối tác chính thức, không được các bên
              đó bảo trợ hay chứng nhận. Xem thêm ở trang{' '}
              <Link href="/phap-ly">Thông tin pháp lý</Link>.
            </p>

            <h2>8. Giới hạn trách nhiệm</h2>
            <ul>
              <li>
                Chúng tôi chịu trách nhiệm về chất lượng sản phẩm đã giao (in ấn, vật liệu, chip
                NFC hoạt động đúng).
              </li>
              <li>
                Số lượng đánh giá quán nhận được phụ thuộc vào khách của bạn và chính sách của
                nền tảng đánh giá (Google Maps, Facebook…). Chúng tôi{' '}
                <b>không cam kết</b> số lượt đánh giá, điểm số hay thứ hạng tìm kiếm.
              </li>
              <li>
                Chúng tôi không chịu trách nhiệm khi nền tảng bên thứ ba thay đổi đường dẫn,
                chính sách hoặc gỡ đánh giá — nhưng sẽ hỗ trợ trỏ lại đích đến mới cho bảng và
                standee bạn đang dùng.
              </li>
              <li>
                Website có thể tạm gián đoạn để bảo trì hoặc do sự cố ngoài tầm kiểm soát.
              </li>
            </ul>

            <h2>9. Thay đổi điều khoản</h2>
            <p>
              Chúng tôi có thể cập nhật điều khoản và sẽ đăng bản mới ngay tại trang này kèm
              ngày sửa. Đơn đã xác nhận áp dụng điều khoản tại thời điểm xác nhận.
            </p>

            <h2>10. Luật áp dụng</h2>
            <p>
              Các điều khoản này được điều chỉnh bởi pháp luật Việt Nam. Tranh chấp phát sinh
              trước hết được giải quyết bằng thương lượng; không thương lượng được thì đưa ra
              toà án có thẩm quyền theo quy định.
            </p>

            <h2>11. Liên hệ</h2>
            <p>
              {brandName} — {legal.companyName}
              <br />
              Hotline: <a href={phoneHref}>{phoneDisplay}</a>
              {legal.email ? <><br />Email: <a href={`mailto:${legal.email}`}>{legal.email}</a></> : null}
            </p>
            <p className="legal-links">
              Xem thêm: <Link href="/chinh-sach-bao-mat">Chính sách quyền riêng tư</Link> ·{' '}
              <Link href="/phap-ly">Thông tin pháp lý</Link>
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
