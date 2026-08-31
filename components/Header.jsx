'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { siteConfig } from '@/lib/siteConfig';
import { products } from '@/data/products';
import ProgressiveImg from './ProgressiveImg';
import MetallicText, { inkMetal } from './MetallicText';
import { PhoneIcon, NfcWaveIcon, MenuIcon, CloseIcon, ChevronDownIcon } from './icons';

// Lấy tên trực tiếp từ data/products.js (nguồn duy nhất của tên sản phẩm) thay vì hardcode
// lại ở đây — trước đây header tự chép tay 'Bảng NFC'/'Standee', sửa tên sản phẩm ở
// data/products.js không tự cập nhật vào đây, phải sửa 2 chỗ.
//
// Dùng khi không được truyền `productLinks` (ảnh mẫu do app/layout.js đọc từ Airtable rồi
// truyền xuống — xem chú thích ở đó). Không có ảnh thì menu vẫn chạy, chỉ thiếu ô ảnh.
const FALLBACK_PRODUCT_LINKS = products.map((p) => ({ href: p.href, label: p.title, image: null }));

// Các mục dẫn tới từng khối nội dung trên trang chủ. BẮT BUỘC có "/" ở đầu chứ không phải
// mỗi "#loi-ich": bấm từ trang con (vd /san-pham/standee) thì "#loi-ich" chỉ tìm khối đó
// trong chính trang con — không có, nên chẳng đi đâu cả. Có "/" thì về trang chủ rồi mới cuộn.
const SECTION_LINKS = [
  { href: '/#cach-hoat-dong', label: 'Cách hoạt động' },
  // `hot` = mục được làm nổi trong nav: chữ đậm hơn một nấc + nhãn "New" nhỏ màu nhấn nhô lên
  // như chỉ số trên (xem .nav-hot/.nav-badge trong globals.css). Để ở dữ liệu chứ không
  // hardcode trong JSX, để sau này chuyển sang mục khác chỉ cần dời một chữ.
  { href: '/thiet-ke-rieng', label: 'Thiết kế riêng', hot: true },
  { href: '/#loi-ich', label: 'Lợi ích' },
  { href: '/#faq', label: 'Câu hỏi' },
];

// Đích của mục "Sản phẩm": khối giới thiệu 2 dòng sản phẩm ngoài trang chủ.
const PRODUCTS_HREF = '/#san-pham';

// "/#loi-ich" -> "loi-ich". Trả null cho link không phải dạng neo tới khối trên trang chủ.
const hashId = (href) => (href.startsWith('/#') ? href.slice(2) : null);

// Các khối trên trang chủ mà menu trỏ tới — dùng để biết khách đang xem khối nào.
const TRACKED_IDS = [PRODUCTS_HREF, ...SECTION_LINKS.map((l) => l.href)].map(hashId);

// Không có mục "Liên hệ" riêng trong nav — nút CTA bên cạnh (btn-primary, nổi bật hơn hẳn
// 1 link chữ thường) đã trỏ /lien-he rồi, thêm 1 link "Liên hệ" nữa trong nav sẽ trùng lặp.

export default function Header({ productLinks }) {
  const PRODUCT_LINKS = productLinks?.length ? productLinks : FALLBACK_PRODUCT_LINKS;
  const [stuck, setStuck] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Mục đang xem: khớp chính xác, hoặc đang ở trang con của nó (vd trang chi tiết
  // một mẫu /san-pham/standee/standee-google-map-... vẫn tính là đang ở "Standee").
  const isActive = (href) => pathname === href || pathname.startsWith(`${href}/`);

  // Mục "Sản phẩm" sáng lên khi đang ở bất kỳ trang sản phẩm nào. Không dùng isActive được:
  // nó trỏ tới '/#san-pham' — một khối trên TRANG CHỦ, không phải một trang riêng.
  const onProductPage = pathname.startsWith('/san-pham');

  // Id khối đang xem trên trang chủ (null = còn ở trên cùng, chưa tới khối nào).
  const [activeId, setActiveId] = useState(null);

  // Các mục dẫn tới khối trên trang chủ chỉ đổi phần #hash chứ KHÔNG đổi pathname, nên không
  // thể suy ra mục đang xem từ pathname: bấm "Lợi ích" xong pathname vẫn là "/" và mục
  // "Trang chủ" cứ sáng mãi. Phải tự bám theo vị trí cuộn.
  useEffect(() => {
    if (pathname !== '/') { setActiveId(null); return; }

    let raf = 0;
    const update = () => {
      raf = 0;
      // Mốc so sánh nằm ngay dưới thanh header dính, khớp với scroll-margin-top của các khối.
      const line = 90;
      let current = null;
      let best = -Infinity;
      // Chọn khối có mép trên gần mốc nhất mà CHƯA vượt qua nó — tức khối đang chiếm màn hình.
      // Cách này không phụ thuộc thứ tự mảng, nên đảo thứ tự khối trong trang cũng không sai.
      for (const id of TRACKED_IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top <= line && top > best) { best = top; current = id; }
      }
      setActiveId(current);
    };

    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [pathname]);

  // Mục neo tới khối: sáng khi đang xem đúng khối đó.
  //
  // Phải loại trường hợp href KHÔNG phải dạng neo (hashId trả null): "Thiết kế riêng" giờ
  // trỏ tới một TRANG thật (/thiet-ke-rieng), mà ở đầu trang chủ thì activeId cũng là null —
  // thiếu chốt chặn này thì null === null và mục đó sáng lên ngay khi khách vừa mở trang chủ.
  const isSectionActive = (href) => {
    const id = hashId(href);
    return id !== null && pathname === '/' && activeId === id;
  };

  // Một mục trong SECTION_LINKS có thể là neo tới khối trên trang chủ HOẶC là một trang
  // riêng — gộp cả hai phép kiểm tra để chỗ nào cũng dùng chung một hàm.
  const isNavActive = (href) => isActive(href) || isSectionActive(href);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Đổi trang thì đóng menu — nếu không, bấm một link xong menu vẫn nằm đè lên trang mới.
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    // Khoá cuộn nền để chỉ cuộn được trong menu.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKeyDown);

    // Màn hình xoay ngang / phóng to qua ngưỡng desktop thì menu mobile không còn nghĩa.
    const mq = window.matchMedia('(min-width: 860px)');
    const onChange = (e) => { if (e.matches) setMenuOpen(false); };
    mq.addEventListener('change', onChange);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
      mq.removeEventListener('change', onChange);
    };
  }, [menuOpen]);

  return (
    // Fragment chứ không bọc tất cả trong <header>: .site-header có backdrop-filter, mà phần
    // tử có backdrop-filter trở thành khối chứa cho con `position: fixed`. Nếu để lớp nền mờ
    // và menu trượt bên trong header, chúng sẽ bị nhốt trong khung header cao ~52px —
    // menu chỉ hiện một mẩu và nền mờ không phủ được trang.
    <>
      <header
        className={`site-header${stuck ? ' is-stuck' : ''}`}
        id="siteHeader"
      >
      <div className="container header-inner">
        <Link className="brand" href="/" aria-label={`${siteConfig.brandName} — về trang chủ`}>
          <span className="brand-mark" aria-hidden="true">
            <NfcWaveIcon />
          </span>
          <span className="brand-name">
            {/* "Review" phủ hiệu ứng kim loại lỏng — xem components/MetallicText.jsx.
                scale nhỏ hơn 2 chỗ kia vì chữ ở đây chỉ cao ~14px: để nguyên scale mặc định
                thì các dải kim loại chen nhau trong vài pixel, nhìn ra nhiễu chứ không ra kim loại. */}
            {siteConfig.brandFirst}
            <MetallicText text={siteConfig.brandLast} {...inkMetal} scale={1.8} />
          </span>
        </Link>

        <nav className="site-nav" aria-label="Điều hướng chính">
          {/* Dropdown mở bằng CSS thuần (:hover / :focus-within), KHÔNG dùng state React —
              nhờ vậy nó vẫn mở được cả khi JS chưa chạy, và bản thân "Sản phẩm" là một link
              thật (không phải <button>) nên máy cảm ứng bấm vào vẫn tới được khối sản phẩm
              ngoài trang chủ thay vì bấm hụt. Tab tới link này cũng làm bung dropdown, từ đó
              tab tiếp vào được các mục bên trong — xem .nav-item:focus-within trong globals.css. */}
          <div className="nav-item">
            <Link
              className="nav-trigger"
              href={PRODUCTS_HREF}
              aria-current={onProductPage || isSectionActive(PRODUCTS_HREF) ? 'page' : undefined}
            >
              Sản phẩm
              <ChevronDownIcon className="nav-caret" aria-hidden="true" />
            </Link>

            <div className="nav-dropdown">
              <ul>
                {PRODUCT_LINKS.map((p) => (
                  <li key={p.href}>
                    <Link href={p.href} aria-current={isActive(p.href) ? 'page' : undefined}>
                      {/* alt rỗng: tên sản phẩm nằm ngay bên cạnh, đặt alt nữa thì trình đọc
                          màn hình đọc đúng một cái tên hai lần cho mỗi mục. */}
                      {p.image && (
                        <ProgressiveImg
                          className="nav-thumb"
                          src={p.image}
                          alt=""
                          sizes="44px"
                        />
                      )}
                      <span className="nav-dropdown-title">{p.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {SECTION_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={l.hot ? 'nav-hot' : undefined}
              aria-current={isNavActive(l.href) ? 'page' : undefined}
            >
              {l.label}
              {/* KHÔNG aria-hidden: trình đọc màn hình đọc "Thiết kế riêng, Mới" là đúng ý,
                  giấu đi thì người dùng bàn phím mất luôn thông tin mà mắt thường thấy. */}
              {l.hot && <span className="nav-badge">New</span>}
            </Link>
          ))}
        </nav>

        <Link className="btn btn-primary btn-sm header-cta" href="/lien-he">
          <PhoneIcon className="i" />
          Liên hệ
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
          aria-expanded={menuOpen}
          aria-controls="mobileMenu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <MenuIcon />
        </button>
        </div>
      </header>

      {/* Lớp nền mờ — bấm ra ngoài để đóng. */}
      <div
        className={`nav-scrim${menuOpen ? ' is-open' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      <nav
        id="mobileMenu"
        className={`mobile-nav${menuOpen ? ' is-open' : ''}`}
        aria-label="Điều hướng trên điện thoại"
        // Khi đóng thì ẩn hẳn khỏi trình đọc màn hình và thứ tự tab, tránh việc
        // người dùng bàn phím tab vào các link vô hình nằm ngoài màn hình.
        inert={!menuOpen}
      >
        {/* Nút đóng nằm TRONG sidebar: sidebar phủ lên cả header nên nút trên header
            sẽ bị che, không bấm được. */}
        <div className="mobile-nav-head">
          <button
            type="button"
            className="nav-toggle mobile-nav-close"
            aria-label="Đóng menu"
            onClick={() => setMenuOpen(false)}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Sidebar mobile có thêm mục Trang chủ ở đầu — logo trong header cũng dẫn về "/",
            nhưng khi sidebar mở thì nó phủ lên cả header (z-index cao hơn) nên logo bị che,
            không bấm được. Nav desktop thì không cần vì logo luôn lộ ra, thêm vào sẽ bị trùng.

            Mọi link đều phải tự đóng menu bằng onClick: các mục section chỉ đổi phần #hash chứ
            KHÔNG đổi pathname, nên useEffect theo dõi pathname ở trên không hề chạy — thiếu
            onClick là bấm xong menu vẫn nằm chình ình đè lên chỗ vừa cuộn tới. */}
        <ul className="mobile-nav-list">
          <li>
            {/* Chỉ sáng khi thực sự đang ở đầu trang chủ. Trước đây chỉ xét pathname nên bấm
                sang khối nào ở trang chủ thì "Trang chủ" vẫn sáng, còn khối vừa chọn thì không. */}
            <Link
              href="/"
              aria-current={pathname === '/' && !activeId ? 'page' : undefined}
              onClick={() => setMenuOpen(false)}
            >
              Trang chủ
            </Link>
          </li>

          {/* Danh sách mẫu luôn mở, không bung/thu — chỉ có 2 mẫu, giấu đi rồi bắt bấm thêm
              một nhịp nữa là thừa. Chỉ hiện TÊN mẫu, bỏ câu mô tả: cột sidebar rộng chừng
              240px nên mỗi câu tagline xuống 3 dòng, hai mục gộp lại thành một khối chữ lổn
              nhổn — đó mới là thứ làm khối này xấu, không phải chuyện đóng hay mở. */}
          <li>
            <Link
              href={PRODUCTS_HREF}
              aria-current={onProductPage || isSectionActive(PRODUCTS_HREF) ? 'page' : undefined}
              onClick={() => setMenuOpen(false)}
            >
              Sản phẩm
            </Link>
            <ul className="mobile-nav-sub">
              {PRODUCT_LINKS.map((p) => (
                <li key={p.href}>
                  <Link
                    href={p.href}
                    aria-current={isActive(p.href) ? 'page' : undefined}
                    onClick={() => setMenuOpen(false)}
                  >
                    {p.image && (
                      <ProgressiveImg
                        className="nav-thumb"
                        src={p.image}
                        alt=""
                        sizes="44px"
                      />
                    )}
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </li>

          {SECTION_LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={l.hot ? 'nav-hot' : undefined}
                aria-current={isNavActive(l.href) ? 'page' : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
                {l.hot && <span className="nav-badge">New</span>}
              </Link>
            </li>
          ))}
        </ul>

        <Link className="btn btn-primary btn-lg mobile-nav-cta" href="/lien-he">
          <PhoneIcon className="i" />
          Liên hệ ngay
        </Link>
        <p className="mobile-nav-note">Trả lời trong vòng 2 phút · Đặt 1 cái cũng nhận</p>
      </nav>
    </>
  );
}
