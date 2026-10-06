import Link from 'next/link';
import HeroVideo from './HeroVideo';
import Reveal from './Reveal';
import { siteConfig } from '@/lib/siteConfig';

// Khối "Liên hệ đặt hàng" đứng ngay trước footer, có mặt trên MỌI trang (gắn trong
// app/layout.js) — thay cho bốn khối chữ "Sẵn sàng chưa? / Gửi tên và địa chỉ cho chúng tôi"
// từng lặp lại ở trang chủ, hai trang dòng sản phẩm và trang chi tiết mẫu.
//
// Chính là video motion graphic Remotion thứ hai (mã nguồn ở video/, xem video/README.md): ngang
// cho desktop (ctaVideo), dọc cho điện thoại (ctaVideoMobile) trong bảng media trang chủ trên
// Airtable. Chỉ có video, không kèm nút: số điện thoại và lời kêu gọi đã nằm ngay trong video,
// còn nút Zalo/gọi thì khách có ở chatbot, footer và trang Liên hệ.
// Chưa có video trên Airtable thì hiện khối chữ dạng cũ (khối đó vẫn giữ hai nút, vì không có
// video thì nó là chỗ duy nhất trong khối mang số liên hệ).
export default function CtaBand({ video, mobileVideo }) {
  const actions = (
    <div className="cta-band-actions">
      <a className="btn btn-primary btn-lg" href={siteConfig.zaloHref} target="_blank" rel="noopener noreferrer">
        Nhắn Zalo ngay
      </a>
      <a className="btn btn-outline btn-lg" href={siteConfig.phoneHref}>
        Gọi {siteConfig.phoneDisplay}
      </a>
    </div>
  );

  // Có video thì video là cả khối, tràn sát hai mép màn hình (không .container, không bo góc,
  // không đệm trên dưới) — một dải phim ngang kết trang ngay trên footer. Chưa có video thì
  // quay về thẻ chữ nền tối nằm trong container như cũ.
  if (video) {
    return (
      <section className="cta-band cta-band-bleed" id="lien-he-nhanh">
        <div className={`cta-video-media${mobileVideo ? ' has-mobile' : ''}`}>
          {/* lazy: chỉ bắt đầu tải khi khách cuộn gần tới — khối này nằm cuối mọi trang,
              không nên giành băng thông với nội dung phía trên. */}
          <HeroVideo
            lazy
            src={video.url}
            mobileSrc={mobileVideo?.url}
            alt={video.alt || 'Liên hệ đặt hàng QuickTapReview: gọi hotline, nhắn Zalo hoặc chat, chỉ cần tên và địa chỉ quán, trả lời trong vòng 2 phút'}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="section cta-band" id="lien-he-nhanh">
      <div className="container">
        <Reveal as="div" className="cta-card">
          <div className="contact-glow" aria-hidden="true" />
          <p className="kicker">Sẵn sàng chưa?</p>
          <h2>Gửi tên và địa chỉ cho chúng tôi</h2>
          <p className="contact-sub">
            Chỉ cần tên và địa chỉ, chúng tôi lo phần còn lại và giao tận nơi. Trả lời trong vòng 2 phút.
          </p>
          {actions}
        </Reveal>
      </div>
    </section>
  );
}
