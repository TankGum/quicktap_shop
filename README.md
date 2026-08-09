# QuickTapReview — Landing site (Next.js)

Trang giới thiệu và bán **thẻ NFC** + **standee để bàn QR/NFC** giúp quán tăng đánh giá trên
Google Maps, Booking.com, TripAdvisor. Xây bằng **Next.js (App Router) + React**, xuất ra
**static HTML/CSS/JS thuần** (`next export`) — không cần Node server lúc chạy, deploy được lên
Cloudflare Pages hoặc bất kỳ static host nào, giống hệt một site tĩnh thông thường.

Giao diện tham khảo cấu trúc của [tapitag.co](https://tapitag.co/) (hero nổi bật, dải số liệu,
value-pillars, FAQ dạng accordion) nhưng giữ tông màu xanh dương/đen/trắng phong cách
Apple/Linear theo đúng yêu cầu gốc.

## Vì sao chuyển sang React/Next.js

- **1 nơi sửa placeholder** — số điện thoại, email, tên thương hiệu nằm trong
  `lib/siteConfig.js`, không phải rải sed qua nhiều file `.html` như bản tĩnh trước.
- **Component dùng chung** — Header, Footer, CTA mobile, icon, minh hoạ SVG chỉ định nghĩa một
  lần, dùng lại ở cả 3 trang thay vì copy-paste HTML.
- **FAQ accordion thật** — có state đóng/mở bằng React thay vì chỉ tĩnh.
- **Metadata/OG theo từng trang** vẫn đầy đủ nhờ Next Metadata API (xuất ra file `.html` tĩnh
  riêng cho từng route, không phải SPA nên crawler Facebook/Zalo đọc đúng thẻ `og:*` của từng
  trang).

## Cấu trúc

```
app/
  layout.js         Khung chung: <html>/<body>, CSS toàn site, Header/Footer/MobileCta, metadata mặc định
  page.js            Trang chủ "/" — Hero, Vấn đề/Giải pháp, Cách hoạt động, Số liệu, Lợi ích,
                      Đối tượng phù hợp, FAQ, CTA cuối trang
  san-pham/page.js   Trang "/san-pham" — chi tiết thẻ NFC & standee
  lien-he/page.js    Trang "/lien-he" — số điện thoại & email để đặt hàng (tel:/mailto:)
  not-found.js       Trang 404 tuỳ chỉnh
  sitemap.js         Sinh sitemap.xml lúc build
  globals.css        Toàn bộ style (mobile-first, dark mode theo hệ thống)

components/
  Header.jsx, Footer.jsx, MobileCta.jsx   Khung site dùng chung
  Reveal.jsx         Hiệu ứng hiện dần khi cuộn (client component, có fallback khi JS tắt)
  FaqAccordion.jsx   Accordion FAQ (client component)
  JsonLd.jsx         Bơm JSON-LD structured data
  icons.jsx          Icon SVG dạng component
  illustrations.jsx  Hình minh hoạ thẻ/standee/hero (SVG vẽ tay — xem mục "Ảnh sản phẩm thật")

lib/siteConfig.js    Cấu hình trung tâm: SĐT, email, tên thương hiệu, số liệu thống kê

public/
  favicon.svg, _headers, robots.txt
  assets/img/og-image.png, apple-touch-icon.png, qr-placeholder.svg
```

## ⚠️ Cần điền trước khi lên sóng

### 1. Số điện thoại, email, tên thương hiệu

Sửa **một chỗ duy nhất** — `lib/siteConfig.js`:

```js
export const siteConfig = {
  brandName: 'QuickTapReview',       // đổi tên thương hiệu nếu cần
  phoneDisplay: '[SỐ ĐIỆN THOẠI]',   // ví dụ: '0901 234 567'
  phoneHref: 'tel:[SỐ ĐIỆN THOẠI]',  // ví dụ: 'tel:+84901234567'
  emailDisplay: '[EMAIL]',           // ví dụ: 'xinchao@quicktapreview.vn'
  emailHref: 'mailto:[EMAIL]?...',   // giữ nguyên phần ?subject=..., chỉ đổi phần mailto:...
  siteUrl: 'https://quicktapreview.vn', // tên miền thật, dùng cho canonical/OG/sitemap
  stats: [...],                      // số liệu thật, hoặc xoá cả khối "Số liệu" ở app/page.js nếu chưa có
};
```

Toàn bộ Header, Footer, CTA mobile, trang Liên hệ, JSON-LD đều đọc từ file này — sửa xong là
cập nhật khắp site.

### 2. Ảnh sản phẩm thật

Hiện dùng hình vẽ SVG minh hoạ (`components/illustrations.jsx`). Khi có ảnh chụp thật, dùng
`next/image` hoặc thẻ `<img>` thường:

- **Hero** (`app/page.js`) — thay `<HeroArt />` bằng ảnh, ví dụ:
  `<img src="/assets/img/hero.jpg" width={1040} height={1040} alt="Standee QR đặt tại quầy thu ngân" />`
- **Sản phẩm** (`app/san-pham/page.js`) — thay `<p.Art .../>` trong từng thẻ sản phẩm bằng ảnh
  tương tự (tỉ lệ ~400×260 là vừa khung `.product-media`).
- Đặt file ảnh vào `public/assets/img/`, tham chiếu bằng đường dẫn tuyệt đối `/assets/img/...`.

### 3. Ảnh chia sẻ (Open Graph)

`public/assets/img/og-image.png` (1200×630) đang là bản dựng sẵn, dùng chung cho cả 3 trang.
Cập nhật `openGraph.images` trong `app/layout.js` nếu đổi ảnh hoặc kích thước.

## Chạy thử tại máy

```bash
npm install
npm run dev        # http://localhost:3000 — có hot reload
```

## Build & xem thử bản tĩnh

```bash
npm run build       # xuất ra thư mục out/
npx serve out        # hoặc: cd out && python3 -m http.server 4173
```

Lưu ý khi test bằng server tĩnh đơn giản: các URL sạch như `/san-pham` (không đuôi `.html`)
chỉ được các host thật (Cloudflare Pages, Netlify, Vercel…) tự động phân giải sang
`san-pham.html`. Với `python -m http.server` hay `npx serve` không có tính năng này, bạn cần
gõ thêm đuôi `.html` khi test tay.

## Deploy lên Cloudflare Pages

- **Build command**: `npm run build`
- **Build output directory**: `out`
- Framework preset: chọn "Next.js (Static HTML Export)" nếu Cloudflare hỏi, hoặc để trống/None
  vì đây là output tĩnh thuần, không cần Cloudflare's Next.js runtime adapter.
- File `public/_headers` được Next tự copy vào `out/_headers` lúc build — Cloudflare Pages đọc
  file này để set cache header cho `/assets/*`, `/_next/static/*` (cache dài hạn) và các trang
  `.html` (không cache, để nội dung mới hiện ngay khi deploy lại).

Deploy tay bằng CLI:

```bash
npm run build
npx wrangler pages deploy out --project-name quicktapreview
```

### Host tĩnh khác

Netlify/Vercel: trỏ build command `npm run build`, publish directory `out`. Cả hai đều tự động
serve URL sạch (không đuôi `.html`) và file `404.html` tuỳ chỉnh.

## Ghi chú kỹ thuật

- `next.config.js` bật `output: 'export'` — bắt buộc để có static HTML/CSS/JS thuần, không
  route nào được dùng tính năng cần server (API routes, ISR, Server Actions…).
- Không tải font/script từ CDN ngoài — dùng font hệ thống.
- Tự đổi màu theo dark mode của máy khách (`prefers-color-scheme`); khối "Liên hệ"/"CTA cuối
  trang" cố tình giữ nền tối cố định (token `--panel-ink`, không đổi theo theme) để tương phản
  trắng-trên-tối luôn đúng dù trang đang sáng hay tối.
- Tôn trọng `prefers-reduced-motion`: tắt hiệu ứng cuộn nếu người dùng bật.
- Có JSON-LD (Organization, Product, FAQPage, WebSite) theo từng trang để Google hiểu nội dung.
- Trang vẫn đọc được đầy đủ nếu JS không chạy (hiệu ứng `.reveal` chỉ áp dụng khi JS thực sự
  hoạt động — xem `document.documentElement.classList.add('js')` trong `app/layout.js`).
