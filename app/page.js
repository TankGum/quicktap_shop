import Link from 'next/link';
import Reveal from '@/components/Reveal';
import FaqAccordion from '@/components/FaqAccordion';
import JsonLd from '@/components/JsonLd';
import ProgressiveImg from '@/components/ProgressiveImg';
import HeroVideo from '@/components/HeroVideo';
import IndustryArt from '@/components/IndustryArt';
import HeroCarousel3D from '@/components/HeroCarousel3D';
import CustomDesignsGallery from '@/components/CustomDesignsGallery';
import Standee3D from '@/components/Standee3D';
import { NfcPlateArt, StandeeArt } from '@/components/illustrations';
import { siteConfig } from '@/lib/siteConfig';
import { products } from '@/data/products';
import { standeeModels } from '@/data/standee3d';
import { industries } from '@/data/industries';
import { getVariantsByProduct, getCustomDesigns, getSiteMedia } from '@/lib/airtable';
import {
  PhoneIcon, ArrowRightIcon, WarningIcon,
  BarsIcon, PinIcon, BoltIcon, PhoneOutlineIcon, LayersIcon, RefreshIcon,
} from '@/components/icons';
import { localBusinessSchema, websiteSchema, faqSchema } from '@/lib/schema';

// Trang chủ trước đây KHÔNG có khối metadata riêng — nó là trang DUY NHẤT của site thiếu thẻ
// canonical, mà lại là trang quan trọng nhất. Thiếu canonical thì mọi biến thể URL cùng trỏ về
// trang chủ (kèm ?fbclid=... khi chia sẻ Facebook, có hoặc không có dấu / ở cuối, và bản
// *.pages.dev mà Cloudflare Pages luôn tạo sẵn) bị Google coi là những trang riêng biệt trùng
// nội dung — nó tự chọn bản nào để xếp hạng, và thường không chọn bản mình muốn.
export const metadata = {
  // `absolute` để bỏ qua template "%s — QuickTapReview" của layout: chuỗi dưới đây đã có sẵn
  // tên thương hiệu ở cuối, để template dán thêm lần nữa là thừa và làm tiêu đề bị cắt cụt.
  title: { absolute: `Bảng NFC & standee QR đánh giá Google Maps — ${siteConfig.brandName}` },
  alternates: { canonical: '/' },
  openGraph: { url: '/' },
};

const ART_BY_ID = { 'bang-nfc': NfcPlateArt, standee: StandeeArt };

// "99.000 VND" -> 99000. Chỉ dùng để SO SÁNH giá, không dùng để hiển thị — chuỗi gốc đã định
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

// Các ý bán hàng ngắn — 3 ý đầu hiện ở dòng thông tin nhỏ dưới nút hero (.hero-meta).
const highlights = [
  { Icon: PhoneOutlineIcon, title: 'Không cần cài app', body: 'Khách chạm là xong' },
  { Icon: RefreshIcon, title: 'Đổi link bất cứ lúc nào', body: 'Không phải làm bảng mới' },
  { Icon: BoltIcon, title: 'Dùng được ngay', body: 'Không phải cài đặt gì' },
  { Icon: LayersIcon, title: 'Freeship Hà Nội', body: 'Đặt 1 cái cũng miễn phí giao' },
];

// Hai quy trình để khách đặt cạnh nhau mà so ở khối "Cách hoạt động".
const howtoFlows = [
  { label: 'Trước đây', count: '5 bước', steps: ['Mở app', 'Tìm tên quán', 'Chọn chi nhánh', 'Cuộn tìm nút', 'Viết'] },
  { label: 'Với QuickTap', count: '1 chạm', steps: ['Chạm hoặc quét', 'Viết'], accent: true },
];

const benefits = [
  { Icon: BarsIcon, title: 'Xin đánh giá nhanh hơn', body: 'Giảm thời gian khách hàng thao tác trên điện thoại.' },
  { Icon: PinIcon, title: 'Lên hạng tìm kiếm', body: 'Review đều đặn giúp quán nổi trên Google Maps.' },
  { Icon: BoltIcon, title: 'Không tốn công cài đặt', body: 'Dùng được ngay khi nhận hàng.' },
  { Icon: PhoneOutlineIcon, title: 'Khách không cài gì', body: 'Có sẵn trên các dòng điện thoại.' },
  { Icon: LayersIcon, title: 'Nhiều nền tảng', body: 'Google Maps, Booking.com, TripAdvisor…' },
  { Icon: RefreshIcon, title: 'Đổi link bất cứ lúc nào', body: 'Không cần làm bảng mới.' },
];


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
    // Đặt NGAY TRƯỚC câu hỏi về thời gian giao: hai câu này khách luôn hỏi liền nhau, và
    // FAQ ở đây tự chảy vào FAQPage trong JSON-LD nên còn có cơ hội hiện thẳng trên Google.
    q: 'Có mất phí giao hàng không?',
    a: 'Giao hàng tại Hà Nội miễn phí, kể cả khi bạn chỉ đặt 1 cái — không có mức đơn tối thiểu. Các tỉnh thành khác phí giao 30.000đ, giao toàn quốc. Tổng tiền hiện đủ trong giỏ hàng trước khi bạn đặt.',
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
      // là chuỗi đã định dạng ("99.000 VND") nên phải rút số ra mới so sánh được.
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

  // Video — bảng "media trang chủ" riêng trên Airtable. Ô trống thì null. heroVideo (+ bản dọc
  // heroVideoMobile) là nhân vật chính của Hero; chưa có thì Hero lùi về mô hình 3D.
  const media = await getSiteMedia();
  const heroVideo = media.heroVideo;

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="hero" id="top">
        <div className="hero-glow" aria-hidden="true" />

        {/* Bố cục hero theo tryonenotch.com: nhãn thương hiệu viết tay trong viên thuốc đen →
            tiêu đề → một câu mô tả → ghi chú tay + nút → dòng thông tin nhỏ, RỒI mới tới hình
            sản phẩm lớn. Nút đứng TRƯỚC video (trước đây đặt sau) để khách thấy ngay lời mời
            trong màn hình đầu tiên mà không phải cuộn qua cả khung video. */}
        <div className="container hero-lead">
          {/* \u00a0 giữa "5" và "sao": không để số rơi lẻ cuối dòng ("Tăng đánh giá 5 / sao…").
              Tag treo lủng lẳng ở cuối vế nhấn như một tag giá — thuần trang trí nên
              aria-hidden, để tên tiêu đề với trình đọc màn hình vẫn chỉ là câu chữ. */}
          <Reveal as="h1">
            Tăng đánh giá 5{'\u00a0'}sao<br />
            <em>
              chỉ với 1 chạm
              <span className="hero-tag" aria-hidden="true">
                <svg className="hero-tag-string" viewBox="0 0 40 44" fill="none">
                  <path d="M2 2C6 14 14 26 26 38" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  <circle cx="2" cy="2" r="2.2" fill="currentColor" />
                </svg>
                <span className="hero-tag-body">SALE</span>
              </span>
            </em>
          </Reveal>
          <Reveal as="p" className="lede">
            Khách chạm điện thoại hoặc quét mã là mở thẳng form đánh giá.
          </Reveal>

          {/* Một viên thuốc đen + một link chữ — như nút "Tải cho Mac" của tryonenotch. Cặp nút
              kim loại trước đây không ăn với hero chữ phẳng mới: hai khối bóng loáng cỡ lớn
              giành hết sự chú ý của tiêu đề. Nút phụ hạ xuống thành link để không tranh với
              nút chính. */}
          <Reveal as="div" className="hero-actions">
            <Link className="btn btn-lg btn-primary" href="/lien-he">
              <PhoneIcon className="i" />
              Liên hệ đặt hàng
            </Link>
            <Link className="btn btn-lg btn-text" href="#san-pham">
              Xem sản phẩm
              <ArrowRightIcon className="i" />
            </Link>
          </Reveal>
          <Reveal as="ul" className="hero-meta" aria-label="Điểm nổi bật">
            {highlights.slice(0, 3).map(({ title }) => <li key={title}>{title}</li>)}
          </Reveal>
        </div>

        {/* Nhân vật chính của hero: video motion graphic (dựng bằng Remotion — mã nguồn ở
            video/, xem video/README.md). Hai bản: heroVideo ngang 16:9 cho desktop,
            heroVideoMobile dọc 9:16 cho điện thoại. Mô hình 3D xoay được nằm ở section ngay
            dưới dải điểm mạnh; Airtable chưa có video thì mô hình 3D quay về đây làm hero.

            KHÔNG bọc Reveal: khối này là thứ khách nhìn thấy đầu tiên, để nó mờ rồi mới hiện
            là mất luôn cảm giác mở trang ra là thấy ngay sản phẩm. */}
        {heroVideo ? (
          <div className="container hero-video">
            <div className={`video-showcase-media${media.heroVideoMobile ? ' has-mobile' : ''}`}>
              <HeroVideo
                src={heroVideo.url}
                mobileSrc={media.heroVideoMobile?.url}
                alt={heroVideo.alt || siteConfig.heroImageAlt}
              />
            </div>
          </div>
        ) : (
          <div className="model-showcase">
            <Standee3D models={standeeModels} />
          </div>
        )}

      </section>

      {/* ============ VÒNG XOAY MẪU ============ */}
      {/* <section className="section section-tight" id="vong-xoay">
        <div className="container">
          <Reveal as="header" className="section-head">
            <h2>Lướt qua toàn bộ mẫu</h2>
          </Reveal>
        </div>
        <HeroCarousel3D items={heroItems} />
      </section> */}

      {/* ============ MÔ HÌNH 3D ============ */}
      {/* Mô hình 3D của chính sản phẩm, khách tự xoay/lật xem mặt sau, mặt đáy — xem
          components/Standee3D.jsx. Trước đây nằm trong Hero; giờ Hero chiếu video, mô hình
          chuyển xuống đây (đúng chỗ section video cũ). Chưa có video thì mô hình vẫn ở Hero và
          section này ẩn, không hiện hai mô hình. */}
      {heroVideo && (
        <section className="section" id="mo-hinh-3d">
          <div className="container">
            <Reveal as="header" className="section-head">
              <p className="kicker">Xem mẫu 3D</p>
              <h2>Xoay, lật, xem kỹ từng mẫu trước khi đặt</h2>
            </Reveal>
          </div>
          <Reveal as="div" className="model-showcase" delay={80}>
            <Standee3D models={standeeModels} />
          </Reveal>
        </section>
      )}

      {/* ============ CÁCH HOẠT ĐỘNG ============ */}
      <section className="section section-alt" id="cach-hoat-dong">
        <div className="container">
          <Reveal as="header" className="section-head">
            <p className="kicker">Cách hoạt động</p>
            <h2>Rút gọn tất cả xuống còn <em className="marker">một bước</em></h2>
          </Reveal>

          {/* Thẻ so sánh bên trái cao bằng video bên phải. Video demo là khổ DỌC 9:16 nên chỉ
              cho nó một cột hẹp (~380px) và nghiêng nhẹ — kiểu khung video của tryonenotch.
              Trước đây video chiếm hơn nửa bề ngang (cao ~1000px) và thẻ chữ chỉ là một ô nhỏ
              lơ lửng giữa khoảng trống bên cạnh.

              Hai quy trình Trước / Sau hiện CÙNG LÚC, xếp chồng để mắt so ngay độ dài hai
              chuỗi bước — bản cũ dùng công tắc gạt, khách phải bấm mới thấy được phía kia. */}
          <div className={`howto${media.demoVideo ? ' has-video' : ''}`} id="giai-phap">
            <Reveal as="div" className="howto-compare">
              <p className="howto-lede">
                Không cần mở app, không cần dò tìm tên quán trên bản đồ — <strong>khách chạm
                điện thoại vào bảng NFC hoặc quét mã QR là trang đánh giá mở ra ngay.</strong>
              </p>

              <div className="howto-flows">
                {howtoFlows.map(({ label, count, steps, accent }) => (
                  <div className={`howto-flow${accent ? ' is-accent' : ''}`} key={label}>
                    <p className="howto-flow-head">
                      <span>{label}</span>
                      <b>{count}</b>
                    </p>
                    <ol className="howto-flow-steps">
                      {steps.map((step) => <li key={step}>{step}</li>)}
                    </ol>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* Chưa có dòng demoVideo trong Airtable thì bỏ hẳn khung video, thẻ so sánh
                đứng một mình ở giữa — không chừa ô trống. */}
            {media.demoVideo && (
              <Reveal as="div" className="howto-video" delay={80}>
                <HeroVideo
                  src={media.demoVideo.url}
                  alt={media.demoVideo.alt || siteConfig.demoVideoAlt}
                />
              </Reveal>
            )}
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

        {/* Hai ô lớn nền xám đặt cạnh nhau, chữ ở trên — ảnh ở dưới: khuôn ô "Lịch / Hẹn giờ"
            của tryonenotch.com. Điện thoại thì xếp chồng. Ảnh vẫn là đường vào trang chi tiết
            (aria-hidden + tabIndex -1 vì nút "Chi tiết" đã trỏ cùng một đích). */}
        <div className="container">
          <div className="product-tiles">
            {showcase.map((p, i) => (
              <Reveal as="article" key={p.id} className="product-tile" delay={i * 80}>
                <div className="product-tile-copy">
                  <p className="kicker">{p.kicker}</p>
                  <h3>{p.title}</h3>
                  <p className="product-tile-desc">{p.body}</p>
                  <div className="product-tile-buy">
                    {p.priceFrom && (
                      <p className="product-tile-price">
                        <span>Chỉ</span> <b>{p.priceFrom}</b>
                      </p>
                    )}
                    <Link className="btn btn-primary" href={p.href}>
                      {p.detail}
                      <ArrowRightIcon className="i" />
                    </Link>
                  </div>
                </div>
                <Link href={p.href} className="product-tile-media" aria-hidden="true" tabIndex={-1}>
                  {p.image ? (
                    <ProgressiveImg src={p.image} alt={p.title} sizes="(min-width: 860px) 50vw, 100vw" />
                  ) : (
                    <p.Art aria-label={p.artLabel} />
                  )}
                </Link>
              </Reveal>
            ))}
          </div>
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
            <h2>In theo logo &amp; màu thương hiệu của bạn <em className="marker marker-yellow">giá không đổi</em></h2>
            <p className="section-sub">
              Tải logo lên là thấy ngay nó nằm trên bảng, kéo chỉnh cho vừa ý rồi gửi —
              hoặc cứ gửi logo để chúng tôi lên mẫu cho bạn duyệt trước khi in.
            </p>
            {/* Cùng kiểu viên thuốc đen với nút chính ở hero. */}
            <Link className="btn btn-lg btn-primary section-head-cta" href="/thiet-ke-rieng">
              Tự lên mẫu ngay
              <ArrowRightIcon className="i" />
            </Link>
          </Reveal>

          {/* Gallery nằm trong .container, thẳng lề với phần chữ phía trên. Bảng Airtable chưa
              có mẫu nào thì CustomDesignsGallery tự ẩn, phần chữ + CTA vẫn giữ. Bấm vào 1 ảnh
              sẽ mở popup xem chi tiết, có next/prev. */}
          <Reveal as="div" delay={80}>
            <CustomDesignsGallery designs={customDesigns} />
          </Reveal>

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
            {/* Minh hoạ phẳng kiểu hoạt hình vẽ bằng SVG (components/IndustryArt.jsx), thay cho
                ảnh chụp thật trước đây — cùng một phong cách cho cả 6 ô. */}
            {industries.map(({ id, label }, i) => (
              <Reveal as="li" className="industry" key={id} delay={(i % 6) * 45}>
                <span className="industry-media" aria-hidden="true">
                  <IndustryArt id={id} className="industry-art" />
                </span>
                <span className="industry-label">{label}</span>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="section" id="faq">
        {/* .faq-layout: desktop chia hai cột, tiêu đề trái — danh sách phải (xem globals.css). */}
        <div className="container faq-layout">
          <Reveal as="header" className="section-head">
            <p className="kicker">Câu hỏi thường gặp</p>
            <h2>Còn thắc mắc gì trước khi đặt hàng?</h2>
          </Reveal>
          <div>
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
        </div>
      </section>


      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            localBusinessSchema,
            websiteSchema,
            faqSchema(faqs),
          ],
        }}
      />
    </>
  );
}
