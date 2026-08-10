import Link from 'next/link';
import Reveal from '@/components/Reveal';
import FaqAccordion from '@/components/FaqAccordion';
import JsonLd from '@/components/JsonLd';
import ProgressiveImg from '@/components/ProgressiveImg';
import HeroVideo from '@/components/HeroVideo';
import CustomDesignsGallery from '@/components/CustomDesignsGallery';
import HowtoToggle from '@/components/HowtoToggle';
import { HeroArt, NfcPlateArt, StandeeArt } from '@/components/illustrations';
import { siteConfig } from '@/lib/siteConfig';
import { products } from '@/data/products';
import { platforms } from '@/data/platforms';
import { industries as industryData } from '@/data/industries';
import { getVariantsByProduct, getCustomDesigns, getSiteMedia } from '@/lib/airtable';
import {
  PhoneIcon, ArrowRightIcon,
  BarsIcon, PinIcon, BoltIcon, PhoneOutlineIcon, LayersIcon, RefreshIcon,
  HotelIcon, HomestayIcon, RestaurantIcon, CafeIcon, SpaIcon, ShopIcon,
} from '@/components/icons';

const ART_BY_ID = { 'bang-nfc': NfcPlateArt, standee: StandeeArt };

const benefits = [
  { Icon: BarsIcon, title: 'Nhiều đánh giá hơn', body: 'Bỏ đi rào cản lớn nhất: công sức.' },
  { Icon: PinIcon, title: 'Lên hạng tìm kiếm', body: 'Review đều đặn giúp quán nổi trên Google Maps.' },
  { Icon: BoltIcon, title: 'Lắp trong 2 phút', body: 'Không phần mềm, không tích hợp POS.' },
  { Icon: PhoneOutlineIcon, title: 'Khách không cài gì', body: 'Có sẵn trên iPhone và Android.' },
  { Icon: LayersIcon, title: 'Nhiều nền tảng', body: 'Google Maps, Booking.com, TripAdvisor…' },
  { Icon: RefreshIcon, title: 'Đổi link bất cứ lúc nào', body: 'Không cần làm bảng mới.' },
];

// Icon chỉ còn vai trò dự phòng khi mục đó chưa có ảnh thật (xem data/industries.js).
const INDUSTRY_ICON = {
  hotel: HotelIcon,
  homestay: HomestayIcon,
  restaurant: RestaurantIcon,
  cafe: CafeIcon,
  spa: SpaIcon,
  shop: ShopIcon,
};
const industries = industryData.map((it) => ({ ...it, Icon: INDUSTRY_ICON[it.id] }));

const faqs = [
  {
    q: 'Khách có cần cài app để dùng bảng NFC không?',
    a: 'Không. iPhone và điện thoại Android đời mới đều đọc được NFC sẵn, và camera có thể quét mã QR trực tiếp. Khách chỉ cần chạm hoặc quét là trang đánh giá mở ra.',
  },
  {
    q: 'Bảng NFC / standee dẫn tới nền tảng đánh giá nào?',
    a: 'Tuỳ bạn chọn: Google Maps, Booking.com, TripAdvisor, Agoda, Facebook hoặc bất kỳ đường dẫn nào khác.',
  },
  {
    q: 'Đổi link đánh giá sau này có phải làm bảng mới không?',
    a: 'Không cần. Chúng tôi trỏ lại đích đến cho bạn, chiếc bảng và standee đang dán/đặt tại quán vẫn dùng bình thường.',
  },
  {
    q: 'Bảng NFC có hoạt động qua ốp lưng điện thoại không?',
    a: 'Hầu hết ốp lưng thường không cản NFC. Với ốp quá dày hoặc có tấm chống từ, khách chỉ cần bỏ ốp ra hoặc dùng mã QR in sẵn trên bảng/standee thay thế.',
  },
  {
    q: 'Cần bao lâu để nhận hàng sau khi đặt?',
    a: 'Tuỳ số lượng và địa chỉ giao — gọi trực tiếp để được báo thời gian cụ thể khi đặt hàng.',
  },
];

export default async function HomePage() {
  // Lấy ảnh thật của từng dòng sản phẩm (ảnh đầu tiên có trong Airtable) để làm ảnh
  // giới thiệu ngoài trang chủ; chưa có ảnh thì rơi về hình minh hoạ SVG.
  const variantsByProduct = await getVariantsByProduct();
  const showcase = products.map((p) => ({
    ...p,
    image: (variantsByProduct[p.id] || []).find((v) => v.image)?.image || null,
    Art: ART_BY_ID[p.id],
  }));

  // Ảnh mẫu "Thiết kế riêng" — bảng Airtable riêng, xem lib/airtable.js.
  const customDesigns = await getCustomDesigns();

  // Video/ảnh hero + video demo — cũng từ bảng Airtable riêng. Ô nào trống thì null.
  const media = await getSiteMedia();

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="hero" id="top">
        <div className="hero-glow" aria-hidden="true" />
        <div className="container hero-inner">
          <div className="hero-copy">
            <Reveal as="p" className="eyebrow">
              <span className="dot" aria-hidden="true" />
              {/* Rút gọn theo tên sản phẩm mới ở data/products.js — giữ đúng 1 dòng, không
                  dán nguyên 2 tên đầy đủ ("Bảng 10x10 dán tường & quầy" / "Standee để bàn
                  A6") vào vì sẽ quá dài cho 1 dòng eyebrow. */}
              Bảng dán tường &amp; standee để bàn cho quán
            </Reveal>
            <Reveal as="h1">Tăng đánh giá 5 sao<br /><em>chỉ với 1 chạm</em></Reveal>
            <Reveal as="p" className="lede">
              Khách chạm điện thoại hoặc quét mã là mở thẳng trang đánh giá.
            </Reveal>

            <Reveal as="div" className="hero-actions">
              <Link className="btn btn-primary btn-lg" href="/lien-he">
                <PhoneIcon className="i" />
                Liên hệ đặt hàng
              </Link>
              <Link className="btn btn-ghost btn-lg" href="#san-pham">
                Xem sản phẩm
                <ArrowRightIcon className="i" />
              </Link>
            </Reveal>

            <Reveal as="ul" className="hero-trust">
              <li>Trả lời trong vòng 2 phút</li>
              <li>Đặt 1 cái cũng nhận</li>
              <li>Khách không cần cài app</li>
              <li>iPhone &amp; Android</li>
            </Reveal>
          </div>

          {/* Video/ảnh hero: upload vào bảng "media trang chủ" trên Airtable, dòng có
              Key = heroVideo / heroImage. Ưu tiên video, rồi tới ảnh, cuối cùng là hình
              minh hoạ SVG — nhờ vậy bảng Airtable trống thì hero vẫn có nội dung. */}
          <Reveal as="div" className="hero-art">
            {/* Sóng lan toả kiểu tín hiệu không dây/NFC — thuần trang trí, nằm sau video. */}
            <div className="hero-waves" aria-hidden="true">
              <span className="hero-wave" />
              <span className="hero-wave" />
              <span className="hero-wave" />
            </div>
            {media.heroVideo ? (
              <HeroVideo
                src={media.heroVideo.url}
                poster={media.heroImage?.url}
                alt={media.heroVideo.alt || siteConfig.heroImageAlt}
              />
            ) : media.heroImage ? (
              <ProgressiveImg
                src={media.heroImage.url}
                alt={media.heroImage.alt || siteConfig.heroImageAlt}
                loading="eager"
              />
            ) : (
              <HeroArt aria-label={siteConfig.heroImageAlt} />
            )}
          </Reveal>
        </div>

        <div className="container">
          <Reveal as="div" className="platform-strip">
            <span className="platform-label">Đưa khách thẳng tới</span>
            <ul className="platform-list">
              {platforms.map(({ name, icon }) => (
                <li key={name}>
                  {icon && <ProgressiveImg src={icon} alt="" className="platform-ico" />}
                  {name}
                </li>
              ))}
              <li className="platform-more">…hoặc bất kỳ link nào bạn chọn</li>
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ============ CÁCH HOẠT ĐỘNG ============ */}
      <section className="section section-alt" id="cach-hoat-dong">
        <div className="container">
          <Reveal as="header" className="section-head">
            <p className="kicker">Cách hoạt động</p>
            <h2>Rút gọn tất cả xuống còn <em>một chạm</em></h2>
          </Reveal>

          <div className="howto" id="giai-phap">
            {/* Chưa có dòng demoVideo trong Airtable thì bỏ hẳn khung video, để bảng
                so sánh Trước/Sau chiếm trọn chỗ — không chừa ô đen trống. */}
            {media.demoVideo && (
              <Reveal as="div" className="howto-video">
                <HeroVideo
                  src={media.demoVideo.url}
                  alt={media.demoVideo.alt || siteConfig.demoVideoAlt}
                />
              </Reveal>
            )}

            <Reveal as="div" className="howto-compare" delay={80}>
              {/* Câu dẫn mở đầu — nói bằng lời trước khi vào phần số liệu bên dưới. */}
              <div className="howto-row">
                <p className="howto-lede">
                  Không cần mở app, không cần dò tìm tên quán trên bản đồ — khách chạm điện
                  thoại vào bảng NFC hoặc quét mã QR là trang đánh giá mở ra ngay.
                </p>
              </div>

              {/* Nút gạt Trước/Sau — bấm để đổi nội dung tại chỗ, xem components/HowtoToggle.jsx. */}
              <div className="howto-row">
                <HowtoToggle />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ SẢN PHẨM ============ */}
      <section className="section" id="san-pham">
        <div className="container">
          <Reveal as="header" className="section-head">
            <p className="kicker">Sản phẩm</p>
            <h2>Hai dạng, chọn theo không gian quán</h2>
          </Reveal>

          <div className="showcase-grid">
            {showcase.map((p, i) => (
              <Reveal as="div" key={p.id} delay={i * 80}>
                <Link className="showcase-card" href={p.href}>
                  <div className="showcase-media">
                    {p.image ? (
                      <ProgressiveImg src={p.image} alt={p.title} />
                    ) : (
                      <p.Art aria-label={p.artLabel} />
                    )}
                  </div>
                  <div className="showcase-body">
                    <h3 className="showcase-title">{p.title}</h3>
                    <p className="showcase-desc">{p.tagline}</p>
                    <span className="showcase-link">
                      Xem chi tiết
                      <ArrowRightIcon className="i" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ THIẾT KẾ RIÊNG ============ */}
      <section className="section" id="thiet-ke-rieng">
        <div className="container">
          <Reveal as="header" className="section-head">
            <p className="kicker">Thiết kế riêng</p>
            <h2>In theo logo &amp; màu thương hiệu của bạn</h2>
            <p className="section-sub">
              Gửi logo và link đánh giá, chúng tôi lên mẫu cho bạn duyệt trước khi in.
            </p>
          </Reveal>

          {/* Bảng Airtable chưa có mẫu nào thì CustomDesignsGallery tự ẩn lưới, phần chữ +
              CTA bên dưới vẫn giữ. Bấm vào 1 ảnh sẽ mở popup xem chi tiết, có next/prev. */}
          <CustomDesignsGallery designs={customDesigns} />

          <Reveal as="p" className="products-note">
            Có mẫu riêng trong đầu rồi?{' '}
            <Link href="/lien-he">Liên hệ để trao đổi thiết kế</Link>.
          </Reveal>
        </div>
      </section>

      {/* ============ LỢI ÍCH ============ */}
      <section className="section" id="loi-ich">
        <div className="container">
          <Reveal as="header" className="section-head">
            <p className="kicker">Lợi ích</p>
            <h2>Vì sao nên đặt một chiếc ngay tại quầy</h2>
          </Reveal>

          {/* Danh sách hàng ngang, không khung thẻ — icon trái, tiêu đề + mô tả phải, ngăn
              cách bằng đường kẻ mảnh. Đổi từ kiểu 6 thẻ vuông đều nhau (nhìn đơn điệu) sang
              phong cách này theo yêu cầu, xem app/globals.css để biết cách chia cột/đường kẻ. */}
          <ul className="benefits-list">
            {benefits.map(({ Icon, title, body }, i) => (
              <Reveal as="li" className="benefit-row" key={title} delay={(i % 2) * 60}>
                <span className="benefit-icon" aria-hidden="true"><Icon /></span>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ============ ĐỐI TƯỢNG PHÙ HỢP ============ */}
      <section className="section section-alt" id="doi-tuong">
        <div className="container">
          <Reveal as="header" className="section-head">
            <p className="kicker">Phù hợp với</p>
            <h2>Bất kỳ nơi nào khách ghé rồi rời đi</h2>
          </Reveal>

          <ul className="industries">
            {industries.map(({ id, label, image, Icon }, i) => (
              <Reveal as="li" className="industry" key={id} delay={(i % 6) * 45}>
                <span className="industry-media" aria-hidden="true">
                  {image ? <ProgressiveImg src={image} alt="" /> : <Icon />}
                </span>
                <span className="industry-label">{label}</span>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="section" id="faq">
        <div className="container">
          <Reveal as="header" className="section-head">
            <p className="kicker">Câu hỏi thường gặp</p>
            <h2>Còn thắc mắc gì trước khi đặt hàng?</h2>
          </Reveal>
          <Reveal as="div">
            <FaqAccordion items={faqs} />
          </Reveal>
        </div>
      </section>

      {/* ============ CTA CUỐI TRANG ============ */}
      <section className="section cta-band">
        <div className="container">
          <Reveal as="div" className="cta-card">
            <div className="contact-glow" aria-hidden="true" />
            <p className="kicker">Sẵn sàng chưa?</p>
            <h2>Gửi tên và địa chỉ quán cho chúng tôi</h2>
            <p className="contact-sub">
              Chỉ cần tên và địa chỉ quán, chúng tôi lo phần còn lại và giao tận nơi. Trả lời trong vòng 2 phút.
            </p>
            <div className="cta-band-actions">
              <Link className="btn btn-primary btn-lg" href="/lien-he">Liên hệ đặt hàng</Link>
            </div>
          </Reveal>
        </div>
      </section>

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Organization',
              '@id': `${siteConfig.siteUrl}/#org`,
              name: siteConfig.brandName,
              url: `${siteConfig.siteUrl}/`,
              telephone: siteConfig.phoneDisplay,
              areaServed: 'VN',
              description:
                'Cung cấp bảng NFC và standee QR giúp quán ăn, khách sạn, cà phê, spa tăng số lượng đánh giá trên Google Maps, Booking.com và TripAdvisor.',
            },
            {
              '@type': 'WebSite',
              url: `${siteConfig.siteUrl}/`,
              name: siteConfig.brandName,
              inLanguage: 'vi',
            },
            {
              '@type': 'FAQPage',
              mainEntity: faqs.map((f) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
              })),
            },
          ],
        }}
      />
    </>
  );
}
