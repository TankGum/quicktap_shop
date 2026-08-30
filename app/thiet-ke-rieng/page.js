import Link from 'next/link';
import Reveal from '@/components/Reveal';
import DesignStudio from '@/components/DesignStudio';
import CustomDesignsGallery from '@/components/CustomDesignsGallery';
import { getCustomDesigns } from '@/lib/airtable';
import { siteConfig } from '@/lib/siteConfig';
import { PhoneIcon } from '@/components/icons';

export const metadata = {
  title: 'Tự thiết kế mẫu riêng',
  description:
    'Tải logo quán lên, kéo chỉnh vị trí và cỡ, xem ngay logo của bạn nằm trên bảng NFC 10x10cm hoặc standee A6 thật rồi gửi cho chúng tôi lên bản in. Giá không đổi so với mẫu có sẵn.',
  alternates: { canonical: '/thiet-ke-rieng' },
  openGraph: {
    url: '/thiet-ke-rieng',
    title: 'Tự thiết kế mẫu riêng',
    description: 'Tải logo lên, xem ngay nó nằm trên sản phẩm thật rồi gửi cho chúng tôi lên bản in.',
  },
  twitter: {
    title: 'Tự thiết kế mẫu riêng',
    description: 'Tải logo lên, xem ngay nó nằm trên sản phẩm thật rồi gửi cho chúng tôi lên bản in.',
  },
};

export default async function CustomDesignPage() {
  const customDesigns = await getCustomDesigns();

  return (
    <>
      <section className="section section-tight">
        <div className="container">
          <Reveal as="header" className="section-head">
            <p className="kicker">Thiết kế riêng</p>
            <h1>Xem trước logo của quán trên sản phẩm thật</h1>
            <p className="section-sub">
              Chọn mẫu, tải logo lên rồi kéo chỉnh cho vừa ý — bạn thấy ngay logo của mình nằm
              trên sản phẩm thật. Giá vẫn như mẫu có sẵn, thiết kế riêng không tính thêm.
            </p>
          </Reveal>

          {/* Công cụ nằm ngoài <Reveal>: nó là phần việc chính của trang, không nên chờ hiệu
              ứng hiện dần mới thấy. Xem components/DesignStudio.jsx. */}
          <DesignStudio />
        </div>
      </section>

      {/* Mẫu đã làm cho quán khác — vừa là bằng chứng vừa là gợi ý cho khách đang bí ý tưởng.
          Bảng Airtable chưa có mẫu nào thì component tự ẩn cả dải. */}
      <section className="section section-alt">
        <div className="container">
          <Reveal as="header" className="section-head">
            <p className="kicker">Đã làm cho quán khác</p>
            <h2>Một vài mẫu chúng tôi đã lên</h2>
          </Reveal>
        </div>

        <CustomDesignsGallery designs={customDesigns} />

        <div className="container">
          <Reveal as="p" className="products-note">
            Muốn trao đổi kỹ hơn trước khi chốt?{' '}
            <Link href="/lien-he">Gọi cho chúng tôi</Link> — trả lời trong vòng 2 phút.
          </Reveal>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container studio-cta">
          <a className="btn btn-primary btn-lg" href={siteConfig.phoneHref}>
            <PhoneIcon className="i" />
            {siteConfig.phoneDisplay}
          </a>
        </div>
      </section>
    </>
  );
}
