import Link from 'next/link';
import Reveal from '@/components/Reveal';
import FaqAccordion from '@/components/FaqAccordion';
import JsonLd from '@/components/JsonLd';
import ProgressiveImg from '@/components/ProgressiveImg';
import HeroVideo from '@/components/HeroVideo';
import HeroCarousel3D from '@/components/HeroCarousel3D';
import CustomDesignsGallery from '@/components/CustomDesignsGallery';
import HowtoToggle from '@/components/HowtoToggle';
import { NfcPlateArt, StandeeArt } from '@/components/illustrations';
import { siteConfig } from '@/lib/siteConfig';
import { products } from '@/data/products';
import { platforms } from '@/data/platforms';
import { industries as industryData } from '@/data/industries';
import { getVariantsByProduct, getCustomDesigns, getSiteMedia } from '@/lib/airtable';
import {
  PhoneIcon, ArrowRightIcon, WarningIcon,
  BarsIcon, PinIcon, BoltIcon, PhoneOutlineIcon, LayersIcon, RefreshIcon,
  HotelIcon, HomestayIcon, RestaurantIcon, CafeIcon, SpaIcon, ShopIcon,
} from '@/components/icons';

const ART_BY_ID = { 'bang-nfc': NfcPlateArt, standee: StandeeArt };

// "99.000đ" -> 99000. Chỉ dùng để SO SÁNH giá, không dùng để hiển thị — chuỗi gốc đã định
// dạng sẵn trong Airtable nên cứ hiện nguyên chuỗi đó.
function toNumber(price) {
  return Number(String(price).replace(/\D/g, '')) || 0;
}

// [[a1, a2, a3], [b1, b2]] -> [a1, b1, a2, b2, a3]. Danh sách nào hết trước thì thôi, phần dư
// của danh sách dài hơn nối tiếp vào cuối — không bỏ sót mẫu nào.
function interleave(lists) {
  const out = [];
  const longest = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < longest; i++) {
    for (const list of lists) {
      if (list[i]) out.push(list[i]);
    }
  }
  return out;
}

// Dải ngay dưới hero — mỗi ý vài chữ, không phải câu dài (khuôn "top features" của Samsung).
const highlights = [
  { Icon: PhoneOutlineIcon, title: 'Không cần cài app', body: 'Khách chạm là xong' },
  { Icon: RefreshIcon, title: 'Đổi link bất cứ lúc nào', body: 'Không phải làm bảng mới' },
  { Icon: BoltIcon, title: 'Dùng được ngay', body: 'Không phải cài đặt gì' },
  { Icon: LayersIcon, title: 'Đặt 1 cái cũng nhận', body: 'Giao trong ngày tại Hà Nội' },
];

const benefits = [
  { Icon: BarsIcon, title: 'Xin đánh giá nhanh hơn', body: 'Giảm thời gian khách hàng thao tác trên điện thoại.' },
  { Icon: PinIcon, title: 'Lên hạng tìm kiếm', body: 'Review đều đặn giúp quán nổi trên Google Maps.' },
  { Icon: BoltIcon, title: 'Không tốn công cài đặt', body: 'Dùng được ngay khi nhận hàng.' },
  { Icon: PhoneOutlineIcon, title: 'Khách không cài gì', body: 'Có sẵn trên các dòng điện thoại.' },
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
    a: 'Hà Nội giao trong ngày với các mẫu có sẵn, tuỳ số lượng và địa chỉ giao — liên hệ để được báo thời gian cụ thể khi đặt hàng.',
  },
  {
    q: 'Dùng bảng NFC dán lên các bề mặt kim loại thì sao?',
    a: 'Hạn chế tối đa bề mặt kim loại, hoặc dùng 1 tấm nhựa mỏng cách ly phía sau bảng NFC. Nếu không, sóng NFC sẽ bị cản và khách chạm không nhận.',
  },
];

export default async function HomePage() {
  // Lấy ảnh thật của từng dòng sản phẩm (ảnh đầu tiên có trong Airtable) để làm ảnh giới
  // thiệu — dùng chung cho cả hero lẫn phần "SẢN PHẨM" bên dưới; chưa có ảnh thì rơi về hình
  // minh hoạ SVG.
  const variantsByProduct = await getVariantsByProduct();
  const showcase = products.map((p) => {
    const variants = variantsByProduct[p.id] || [];
    return {
      ...p,
      image: variants.find((v) => v.image)?.image || null,
      Art: ART_BY_ID[p.id],
      // Giá thấp nhất của dòng, để hiện "Chỉ ..." ngay ngoài trang chủ. Giá trong Airtable
      // là chuỗi đã định dạng ("99.000đ") nên phải rút số ra mới so sánh được.
      priceFrom: variants
        .map((v) => v.price)
        .filter(Boolean)
        .sort((a, b) => toNumber(a) - toNumber(b))[0] || null,
    };
  });

  // Toàn bộ mẫu thật (có ảnh) cho dải chọn mẫu ở hero — XEN KẼ hai dòng sản phẩm thay vì nối
  // đuôi nhau, để dải không rơi vào cảnh "4 bảng liền một mạch rồi mới tới standee".
  const heroItems = interleave(
    products.map((p) => (variantsByProduct[p.id] || []).filter((v) => v.image))
  ).map(({ id, href, name, price, image }) => ({ id, href, name, price, image }));

  // Ảnh mẫu "Thiết kế riêng" — bảng Airtable riêng, xem lib/airtable.js.
  const customDesigns = await getCustomDesigns();

  // Video demo — bảng "media trang chủ" riêng trên Airtable. Ô trống thì null; heroVideo giờ
  // chỉ dùng cho section "VIDEO SẢN PHẨM" riêng ngay sau Hero (không còn nằm trong Hero nữa —
  // Hero dùng ảnh thật của 2 dòng sản phẩm qua HeroShowcase ở trên).
  const media = await getSiteMedia();

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="hero" id="top">
        <div className="hero-glow" aria-hidden="true" />

        <div className="container hero-lead">
          <Reveal as="h1">Tăng đánh giá 5 sao <em>chỉ với 1 chạm</em></Reveal>
          <Reveal as="p" className="lede">
            Khách chạm điện thoại hoặc quét mã là mở thẳng form đánh giá.
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
        </div>

        {/* Vòng xoay 3D chiếm trọn bề ngang, đặt NGOÀI .container để tràn hết hai mép màn hình —
            xem components/HeroCarousel3D.jsx. Airtable chưa có mẫu nào kèm ảnh thì component
            trả về null: hero rút gọn còn phần chữ, vẫn đọc được bình thường. */}
        <HeroCarousel3D items={heroItems} />
      </section>

      {/* ============ DẢI ĐIỂM MẠNH ============ */}
      {/* Khuôn "top features" của Samsung: ngay dưới hero là một dải ngắn các ý bán hàng, mỗi ý
          một icon và vài chữ — không phải đoạn văn. Trước đây các ý này bị nhồi vào chân hero
          làm hero rối. */}
      <section className="section section-tight" id="diem-manh">
        <div className="container">
          {/* Mỗi ý là một THẺ riêng (nền xám nhạt, bo góc) thay vì các dòng ngăn nhau bằng kẻ
              mảnh như trước: 4 ý ngắn xếp thành dải kẻ ngang trông như phần chú thích rơi rớt
              lại của hero chứ không ra "điểm mạnh".

              Thẻ chỉ có chữ, KHÔNG icon và KHÔNG số thứ tự: nội dung mỗi thẻ vỏn vẹn 3-5 chữ
              nên thêm một hình nhỏ ở đầu chỉ làm loãng, mà số thì không mang nghĩa thứ tự.
              Vì vậy <ul> chứ không phải <ol>. */}
          <Reveal as="ul" className="highlight-strip">
            {highlights.map(({ title, body }) => (
              <li className="highlight-item" key={title}>
                <h3>{title}</h3>
                <p>{body}</p>
              </li>
            ))}
          </Reveal>

          <Reveal as="div" className="platform-strip" delay={80}>
            <span className="platform-label">Đưa khách thẳng tới</span>
            <ul className="platform-list">
              {platforms.map(({ name, icon }) => (
                <li key={name}>
                  {icon && <ProgressiveImg src={icon} alt="" className="platform-ico" />}
                  {name}
                </li>
              ))}
              <li className="platform-more">…hoặc bất kỳ link nào</li>
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ============ VIDEO SẢN PHẨM ============ */}
      {/* Trước đây video này nằm trong Hero (field heroVideo) — chuyển xuống thành section
          riêng ngay sau Hero để Hero tập trung vào ảnh sản phẩm. Airtable chưa có heroVideo
          thì ẩn hẳn section, không để khung trống. */}
      {media.heroVideo && (
        <section className="section video-showcase" id="video-san-pham">
          <div className="container">
            <Reveal as="header" className="section-head">
              <h2>Một chạm, trang đánh giá mở ra ngay</h2>
            </Reveal>
            <Reveal as="div" className="video-showcase-media" delay={80}>
              <HeroVideo
                src={media.heroVideo.url}
                alt={media.heroVideo.alt || siteConfig.heroImageAlt}
              />
            </Reveal>
          </div>
        </section>
      )}

      {/* ============ CÁCH HOẠT ĐỘNG ============ */}
      <section className="section section-alt" id="cach-hoat-dong">
        <div className="container">
          <Reveal as="header" className="section-head">
            <p className="kicker">Cách hoạt động</p>
            <h2>Rút gọn tất cả xuống còn <em>một bước</em></h2>
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

      {/* ============ ẢNH DÙNG THẬT ============ */}
      {/* Ảnh "một chạm ra kết quả": tay cầm standee + điện thoại đang mở form đánh giá.
          Đặt ngay sau phần "Cách hoạt động" vì nó chính là ảnh chứng minh cho đoạn vừa đọc.
          Mượn nguyên khuôn .product-split của phần Sản phẩm bên dưới để không đẻ thêm một
          kiểu bố cục mới — ảnh một bên, chữ một bên, tự xuống hàng dưới 860px. */}
      <section className="section" id="dung-that">
        <Reveal as="div" className="product-split usage-split">
          <div className="product-split-media">
            <ProgressiveImg
              src="/assets/img/qc.webp"
              alt="Một tay cầm standee QR có logo Google, tay kia cầm điện thoại đang mở sẵn form đánh giá 5 sao"
              sizes="(min-width: 860px) 50vw, 100vw"
            />
          </div>

          <div className="product-split-copy">
            <p className="kicker">Khách thấy gì</p>
            <h3>Chạm xong là form đánh giá đã nằm sẵn trên tay khách</h3>
            <p className="product-split-desc">
              Không có bước trung gian nào: không mở app, không gõ tên quán, không dò trên bản
              đồ. Khách chỉ việc chọn sao rồi bấm gửi.
            </p>

            <ul className="product-split-ticks">
              <li>Chạm NFC hoặc quét QR đều được, tuỳ điện thoại của khách</li>
              <li>Trang đánh giá mở thẳng đúng quán của bạn</li>
              <li>Cả quá trình gọn trong vài giây, ngay tại quầy</li>
            </ul>

            <div className="product-split-actions">
              <Link className="btn btn-primary" href="/lien-he">
                <PhoneIcon className="i" />
                Liên hệ đặt hàng
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ============ SẢN PHẨM ============ */}
      {/* Khuôn "split" của Samsung: mỗi dòng sản phẩm chiếm trọn một dải ngang riêng, ảnh thật
          cỡ lớn một bên, chữ bên kia, và ĐỔI CHIỀU luân phiên để mắt không đi thẳng một mạch.
          Khác hẳn kiểu 2 thẻ nhỏ nằm cạnh nhau trước đây — ảnh giờ đủ to để nhìn ra sản phẩm. */}
      <section className="section" id="san-pham">
        <div className="container">
          <Reveal as="header" className="section-head">
            <p className="kicker">Sản phẩm</p>
            <h2>Hai kiểu, chọn theo không gian quán</h2>
          </Reveal>
        </div>

        <div className="product-splits">
          {showcase.map((p, i) => (
            <Reveal as="article" key={p.id} className={`product-split${i % 2 ? ' is-flipped' : ''}`}>
              <div className="product-split-media">
                {p.image ? (
                  <ProgressiveImg src={p.image} alt={p.title} sizes="(min-width: 860px) 50vw, 100vw" />
                ) : (
                  <p.Art aria-label={p.artLabel} />
                )}
              </div>

              <div className="product-split-copy">
                <p className="kicker">{p.kicker}</p>
                <h3>{p.title}</h3>
                <p className="product-split-desc">{p.body}</p>

                <ul className="product-split-ticks">
                  {p.ticks.map((t) => <li key={t}>{t}</li>)}
                </ul>

                {p.priceFrom && (
                  <p className="product-split-price">
                    <span>Chỉ</span>
                    <b>{p.priceFrom}</b>
                  </p>
                )}

                <div className="product-split-actions">
                  <Link className="btn btn-primary" href="/lien-he">{p.cta}</Link>
                  <Link className="btn btn-ghost" href={p.href}>
                    {p.detail}
                    <ArrowRightIcon className="i" />
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ DÀN MẪU CÓ SẴN ============ */}
      {/* Trước đây chỗ này là lưới mosaic ghép từ ảnh Airtable, mỗi ô dẫn vào một trang mẫu.
          Nay thay bằng MỘT tấm ảnh chụp cả dàn mẫu — nên phần dẫn đường vào trang sản phẩm
          không còn nằm trên ảnh nữa, phải bù lại bằng hai link ở dưới, đừng bỏ đi.

          Ảnh nền trắng nên phải lồng trong thẻ nền trắng: đặt trần lên nền xám của
          .section-alt sẽ lộ ra một hình chữ nhật trắng lơ lửng giữa khoảng xám. */}
      <section className="section section-alt" id="anh-that">
        <div className="container">
          <Reveal as="header" className="section-head">
            <p className="kicker">Mẫu có sẵn</p>
            <h2>Chọn màu hợp với không gian quán</h2>
            <p className="section-sub">
              Cùng một chiếc bảng NFC, đổi màu và nền tảng đánh giá theo quán bạn — hoặc in
              riêng theo logo và màu thương hiệu.
            </p>
          </Reveal>

          <Reveal as="div" className="lineup-photo" delay={80}>
            <ProgressiveImg
              src="/assets/img/qc2.webp"
              alt="Bốn mẫu bảng NFC: nâu, xanh lá, xanh dương dẫn tới Google và một mẫu trắng xanh dẫn tới Tripadvisor"
              sizes="(min-width: 1120px) 1040px, 100vw"
            />
          </Reveal>

          <Reveal as="p" className="products-note" delay={120}>
            Xem đủ mẫu và giá: <Link href="/san-pham/bang-nfc">Bảng NFC</Link>
            {' · '}
            <Link href="/san-pham/standee">Standee QR</Link>
          </Reveal>
        </div>
      </section>

      {/* ============ THIẾT KẾ RIÊNG ============ */}
      <section className="section" id="thiet-ke-rieng">
        <div className="container">
          <Reveal as="header" className="section-head">
            <p className="kicker">Thiết kế riêng</p>
            <h2>In theo logo &amp; màu thương hiệu của bạn giá không đổi</h2>
            <p className="section-sub">
              Tải logo lên là thấy ngay nó nằm trên bảng, kéo chỉnh cho vừa ý rồi gửi —
              hoặc cứ gửi logo để chúng tôi lên mẫu cho bạn duyệt trước khi in.
            </p>
            <Link className="btn btn-primary btn-lg section-head-cta" href="/thiet-ke-rieng">
              Tự lên mẫu ngay
              <ArrowRightIcon className="i" />
            </Link>
          </Reveal>

        </div>

        {/* Đặt NGOÀI .container để dải ảnh chạy ra tận hai mép màn hình. Để bên trong rồi kéo
            rộng bằng 100vw thì thừa ra đúng bề ngang thanh cuộn và làm dải lệch tâm.
            Bảng Airtable chưa có mẫu nào thì CustomDesignsGallery tự ẩn dải, phần chữ + CTA
            bên dưới vẫn giữ. Bấm vào 1 ảnh sẽ mở popup xem chi tiết, có next/prev. */}
        <CustomDesignsGallery designs={customDesigns} />

        <div className="container">
          <Reveal as="p" className="products-note">
            Muốn trao đổi trước?{' '}
            <Link href="/lien-he">Liên hệ để bàn về thiết kế</Link>.
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

          {/* Danh sách đánh số kiểu biên tập: bỏ icon, chỉ còn số thứ tự nhỏ màu nhấn, tiêu đề
              và một dòng mô tả, ngăn nhau bằng kẻ mảnh. Chữ làm chủ đạo — hợp tông tối giản
              của site hơn kiểu 6 thẻ icon trần trước đây.

              Số chỉ để đánh dấu thị giác, KHÔNG mang nghĩa thứ tự (6 lợi ích ngang hàng nhau),
              nên để <ul> chứ không phải <ol>, và số thì aria-hidden để trình đọc màn hình
              không đọc "01, 02..." như thể đây là các bước phải làm theo trình tự. */}
          <ul className="benefit-list">
            {benefits.map(({ title, body }, i) => (
              <Reveal as="li" className="benefit-item" key={title} delay={(i % 2) * 60}>
                <span className="benefit-num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
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
            <h2>Các ngành nghề  dịch vụ chăm sóc khách hàng</h2>
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

          {/* Lưu ý này trước đây nằm ở chân hero — một câu dài giữa toàn cụm ngắn, làm hero
              rối. Đây mới đúng chỗ của nó: khối giải đáp thắc mắc trước khi đặt hàng. */}
          <Reveal as="p" className="faq-note" delay={80}>
            <WarningIcon className="faq-note-icon" aria-hidden="true" />
            Một số điện thoại Android có chip NFC nằm ở giữa mặt lưng thay vì gần camera phía trên — khách chạm không nhận thì thử di chuyển sát khu vực đó.
          </Reveal>
        </div>
      </section>

      {/* ============ CTA CUỐI TRANG ============ */}
      <section className="section cta-band">
        <div className="container">
          <Reveal as="div" className="cta-card">
            <div className="contact-glow" aria-hidden="true" />
            <p className="kicker">Sẵn sàng chưa?</p>
            <h2>Gửi tên và địa chỉ cho chúng tôi</h2>
            <p className="contact-sub">
              Chỉ cần tên và địa chỉ, chúng tôi lo phần còn lại và giao tận nơi. Trả lời trong vòng 2 phút.
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
