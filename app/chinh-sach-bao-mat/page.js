import Link from 'next/link';
import Reveal from '@/components/Reveal';
import { siteConfig } from '@/lib/siteConfig';

// Chính sách quyền riêng tư.
//
// Nội dung ở đây mô tả ĐÚNG những gì code thật đang làm, không phải mẫu chung tải trên mạng:
// dữ liệu nào được thu thập lấy từ components/DesignStudio.jsx, nơi lưu và bên thứ ba lấy từ
// functions/api/thiet-ke-rieng.js (Cloudflare D1 + KV, Cloudinary, Telegram). Sửa luồng nhận
// đơn thì phải xem lại trang này — một chính sách nói sai về chính hệ thống của mình còn tệ
// hơn là không có.

export const metadata = {
  title: 'Chính sách quyền riêng tư',
  description:
    'Chúng tôi thu thập những gì khi bạn gửi mẫu thiết kế hoặc đặt hàng, lưu ở đâu, trong bao lâu, và cách yêu cầu xoá dữ liệu.',
  alternates: { canonical: '/chinh-sach-bao-mat' },
  openGraph: {
    url: '/chinh-sach-bao-mat',
    title: 'Chính sách quyền riêng tư',
    description: 'Chúng tôi thu thập những gì, lưu ở đâu, bao lâu và cách yêu cầu xoá dữ liệu.',
  },
  twitter: {
    title: 'Chính sách quyền riêng tư',
    description: 'Chúng tôi thu thập những gì, lưu ở đâu, bao lâu và cách yêu cầu xoá dữ liệu.',
  },
};

export default function PrivacyPage() {
  const { legal, brandName, phoneDisplay, phoneHref, zaloHref } = siteConfig;

  return (
    <>
      <section className="page-hero">
        <div className="hero-glow" aria-hidden="true" />
        <div className="container">
          <Reveal as="p" className="kicker">Pháp lý</Reveal>
          <Reveal as="h1">Chính sách quyền riêng tư</Reveal>
          <Reveal as="p" className="page-hero-sub">
            Chúng tôi chỉ giữ đúng những gì cần để gọi lại và làm hàng cho bạn: tên quán, số
            điện thoại và mẫu bạn đã chốt. Không hơn.
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <article className="legal-doc">
            <p className="legal-updated">Cập nhật lần cuối: {legal.updatedAt}</p>

            <h2>1. Chúng tôi thu thập gì</h2>
            <p>
              Website không có tài khoản đăng nhập, không bán hàng trực tuyến và không nhận
              thanh toán online. Chúng tôi chỉ nhận thông tin khi bạn <em>chủ động</em> gửi:
            </p>
            <ul>
              <li>
                <b>Khi gửi mẫu ở trang Thiết kế riêng:</b> tên quán, số điện thoại, số lượng,
                ghi chú của bạn và ảnh mẫu đã dựng (logo bạn tải lên được ghép sẵn vào ảnh này).
              </li>
              <li>
                <b>Khi gọi điện hoặc nhắn Zalo:</b> những gì bạn tự cung cấp trong cuộc trao đổi.
              </li>
              <li>
                <b>Khi dùng khung chat trợ lý:</b> nội dung câu hỏi bạn gõ. Trước khi lưu, hệ
                thống tự thay số điện thoại, mã đơn và địa chỉ email xuất hiện trong nội dung
                bằng nhãn chung — chúng tôi giữ lại <em>câu hỏi</em> để cải thiện phần trả lời,
                không giữ danh tính người hỏi. Muốn tra đơn qua khung chat thì bạn phải đưa cả
                mã đơn lẫn số điện thoại đã dùng lúc đặt; cần đủ hai thông tin là để người khác
                không tra được đơn của bạn.
              </li>
              <li>
                <b>Số đếm chống spam:</b> hệ thống đếm số lần gửi theo địa chỉ IP để chặn gửi
                hàng loạt. Bộ đếm này tự xoá sau tối đa 24 giờ và không gắn với đơn hàng nào.
              </li>
            </ul>
            <p>
              Khi bạn đặt qua <Link href="/gio-hang">giỏ hàng</Link>, chúng tôi lưu thêm{' '}
              <b>địa chỉ giao hàng</b> (tỉnh/thành, phường/xã, số nhà và tên đường) và{' '}
              <b>hình thức thanh toán</b> bạn chọn. Nếu bạn chuyển khoản và gửi ảnh chụp màn
              hình xác nhận, chúng tôi lưu ảnh đó trong kho riêng tư để đối chiếu — ảnh{' '}
              <b>không</b> có đường dẫn công khai, chỉ nhân viên xử lý đơn mở được. Việc gửi ảnh
              là tuỳ chọn, đơn của bạn vẫn được ghi nhận nếu không gửi.
            </p>
            <p>
              Chúng tôi <b>không</b> thu thập email, <b>không</b> lưu số thẻ hay thông tin đăng
              nhập ngân hàng của bạn (chúng tôi không có cổng thanh toán — bạn chuyển khoản trực
              tiếp qua ứng dụng ngân hàng của mình), không thu thập vị trí và không lập hồ sơ
              hành vi người dùng.
            </p>

            <h2>2. Dùng để làm gì</h2>
            <ul>
              <li>Gọi lại tư vấn, xác nhận mẫu và chốt đơn.</li>
              <li>Lên bản in và sản xuất đúng mẫu bạn đã chọn.</li>
              <li>Giao hàng và hỗ trợ sau bán (đổi mẫu, làm lại, bảo hành).</li>
              <li>Chặn gửi rác lên hệ thống nhận đơn.</li>
            </ul>
            <p>
              Chúng tôi không bán, không cho thuê và không trao đổi thông tin của bạn cho bên
              thứ ba vì mục đích quảng cáo.
            </p>

            <h2>3. Lưu ở đâu, trong bao lâu</h2>
            <ul>
              <li>
                <b>Thông tin đơn</b> (tên quán, số điện thoại, số lượng, ghi chú) lưu trong cơ
                sở dữ liệu của chúng tôi đặt trên hạ tầng Cloudflare.
              </li>
              <li>
                <b>Ảnh mẫu</b> lưu trên dịch vụ lưu trữ ảnh Cloudinary, truy cập bằng đường dẫn
                riêng của từng đơn.
              </li>
              <li>
                <b>Thông báo đơn mới</b> được gửi cho đội ngũ bán hàng qua Telegram, kèm các
                thông tin bạn vừa điền để gọi lại kịp thời.
              </li>
              <li>
                <b>Nội dung chat</b> (bản đã ẩn danh hoá như nêu ở mục 1) lưu cùng cơ sở dữ liệu
                trên hạ tầng Cloudflare. Câu hỏi của bạn được gửi tới dịch vụ trí tuệ nhân tạo
                của Cloudflare để sinh câu trả lời; nội dung hội thoại trên máy bạn tự xoá khi
                đóng tab.
              </li>
            </ul>
            <p>
              Chúng tôi giữ thông tin đơn trong thời gian còn hỗ trợ bảo hành và đối chiếu khi
              bạn đặt lại. Bạn yêu cầu xoá thì chúng tôi xoá, trừ phần bắt buộc phải lưu theo
              quy định về hoá đơn, chứng từ.
            </p>

            <h2>4. Chia sẻ với ai</h2>
            <p>
              Ngoài các nhà cung cấp hạ tầng nêu ở mục 3 (Cloudflare, Cloudinary, Telegram) và
              đơn vị vận chuyển khi giao hàng cho bạn, chúng tôi không chia sẻ dữ liệu với ai
              khác. Chúng tôi có thể cung cấp thông tin cho cơ quan nhà nước có thẩm quyền khi
              được yêu cầu hợp pháp.
            </p>

            <h2>5. Cookie và công cụ theo dõi</h2>
            <p>
              Website <b>không</b> đặt cookie quảng cáo, không gắn mã theo dõi của mạng xã hội
              và không chạy công cụ phân tích hành vi. Nhà cung cấp hạ tầng (Cloudflare) có thể
              đặt cookie kỹ thuật phục vụ bảo mật và chống tấn công — loại cookie này không dùng
              để nhận dạng bạn cho mục đích quảng cáo.
            </p>
            <p>
              Các nút gọi điện và Zalo trên website dẫn bạn sang ứng dụng/dịch vụ của bên thứ
              ba; khi đã rời khỏi website, chính sách của bên đó được áp dụng.
            </p>

            <h2>6. Quyền của bạn</h2>
            <p>
              Bạn có quyền yêu cầu xem, sửa hoặc xoá thông tin mình đã gửi. Gọi{' '}
              <a href={phoneHref}>{phoneDisplay}</a> hoặc nhắn{' '}
              <a href={zaloHref} target="_blank" rel="noopener noreferrer">Zalo</a> và đọc mã đơn
              (dạng <code>TK-XXXX</code>, hiện ngay sau khi bạn gửi mẫu) — có mã thì chúng tôi
              tìm đúng đơn của bạn trong vài giây.
            </p>

            <h2>7. Bảo mật</h2>
            <p>
              Website chạy hoàn toàn qua kết nối mã hoá HTTPS. Khoá truy cập hệ thống nhận đơn
              chỉ nằm ở phía máy chủ, không nhúng trong trang web. Tuy nhiên không có hệ thống
              nào an toàn tuyệt đối — bạn đừng gửi cho chúng tôi những thông tin nhạy cảm không
              cần thiết cho việc đặt hàng.
            </p>

            <h2>8. Thay đổi chính sách</h2>
            <p>
              Khi thay đổi, chúng tôi cập nhật nội dung tại chính trang này kèm ngày sửa ở đầu
              trang. Bản đang hiển thị là bản có hiệu lực.
            </p>

            <h2>9. Liên hệ</h2>
            <p>
              {brandName} — {legal.companyName}
              <br />
              Hotline: <a href={phoneHref}>{phoneDisplay}</a>
              {legal.email ? <><br />Email: <a href={`mailto:${legal.email}`}>{legal.email}</a></> : null}
            </p>
            <p className="legal-links">
              Xem thêm: <Link href="/dieu-khoan-su-dung">Điều khoản sử dụng</Link> ·{' '}
              <Link href="/phap-ly">Thông tin pháp lý</Link>
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
