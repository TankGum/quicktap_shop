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

**Hero** (`components/HeroShowcase.jsx`) và phần "SẢN PHẨM" ở trang chủ tự lấy ảnh chụp thật
của từng dòng sản phẩm từ Airtable (ảnh đầu tiên có trong bảng mẫu — xem `getVariantsByProduct`
trong `lib/airtable.js`) — **không cần sửa code**, chỉ cần upload ảnh vào form Airtable. Dòng
sản phẩm nào chưa có ảnh thật thì tự rơi về hình vẽ SVG minh hoạ (`components/illustrations.jsx`,
`NfcPlateArt`/`StandeeArt`) làm placeholder tạm thời.

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

### Nhận đơn "Thiết kế riêng" (`functions/`)

Trang `/thiet-ke-rieng` cho khách tự lên mẫu rồi gửi về. Phần nhận đơn là một **Cloudflare
Pages Function** ở `functions/api/thiet-ke-rieng.js` — Pages tự nhận thư mục `functions/` và
phục vụ nó tại `/api/thiet-ke-rieng`, cùng tên miền với site.

Vì sao phải có nó: site là static export nên không có API route của Next; mà ghi Airtable thì
cần token có quyền đọc/ghi TOÀN BỘ base. Gọi Airtable thẳng từ trình duyệt là công khai token
đó cho bất kỳ ai mở DevTools.

**1. Bảng đơn trong Airtable.** Bảng đang dùng là `tblanHEK8kMKXqNMU` (đặt trong biến
`AIRTABLE_DESIGN_ORDERS_TABLE_ID`). Function ghi theo ĐÚNG tên cột dưới đây — sai một tên là
Airtable trả 422 và rớt nguyên cả đơn, không phải chỉ thiếu một ô:

| Cột | Kiểu | Nội dung |
| --- | --- | --- |
| `Customer Name` | Single line text | Tên quán |
| `Phone Number` | Phone / text | Số điện thoại |
| `Quantity` | Number | Số lượng |
| `Notes` | Long text | Ghi chú của khách |
| `Order Date` | Date (bật cả giờ) | Ngày giờ đặt, ghi theo chuẩn ISO |
| `Cloudinary Link` | URL | Link tới ảnh mẫu khách đã chốt |

Ảnh lưu bằng LINK chứ không đính kèm vào Airtable: file chỉ nằm đúng một chỗ (Cloudinary),
không ăn dung lượng đính kèm của Airtable, và link Cloudinary thì vĩnh viễn. Muốn nhìn thấy ảnh
thu nhỏ ngay trong lưới Airtable thì đổi cột sang kiểu Attachment và sửa
`'Cloudinary Link': designUrl` thành `'Cloudinary Link': [{ url: designUrl }]` trong Function.

KHÔNG lưu mã màu nền, tên mẫu hay loại sản phẩm — cả ba đều nhìn thấy ngay trong ảnh mẫu.
Mã đơn (`TK-8F3K`) cũng không thành cột riêng: nó nằm sẵn trong tên file trên Cloudinary
(`.../TK-8F3K-mau.png`) và được hiện cho khách ngay sau khi gửi.

**Chỉ ảnh mẫu được tải lên, không có file logo gốc.** Bảng có đúng một cột link, mà logo có thể
nặng tới 10MB — bắt khách tải lên một thứ rồi vứt đi là vô lý. Nếu sau này cần logo gốc để lên
bản in, thêm cột `Logo URL` vào bảng rồi mở lại phần đã ghi chú trong
`functions/api/thiet-ke-rieng.js` và `components/DesignStudio.jsx`.

**2. Token Airtable phải có quyền GHI** (`data.records:write`) trên base này. Token chỉ dùng để
đọc lúc build sẽ làm mọi đơn rớt ở bước cuối với lỗi 403.

**3. KV namespace để chặn spam.** Tạo ở Cloudflare → Workers & Pages → KV, rồi vào project
Pages → Settings → Functions → **KV namespace bindings**, đặt tên biến là **`KV_BINDING`** và
trỏ tới namespace đó. Nhớ làm cho **cả Production lẫn Preview** — bind thiếu một môi trường thì
môi trường đó trả 503.

Binding này là **bắt buộc**: thiếu nó thì endpoint vẫn chạy nhưng không còn gì chặn spam, tức
là hỏng đúng thứ đang cần bảo vệ mà nhìn từ ngoài lại tưởng bình thường. Nên Function trả 503
luôn nếu chưa có.

Hạn mức đang đặt (sửa ở đầu `functions/api/thiet-ke-rieng.js`):

| Phạm vi | Mức |
| --- | --- |
| 1 IP | 3 đơn / 10 phút |
| 1 IP | 10 đơn / ngày |
| Toàn bộ endpoint | 200 đơn / ngày |

Trần tổng là cái van cuối: IP thì đổi được (VPN, botnet), nên cần một mức chặn không phụ thuộc
IP để không ai đốt được hoá đơn Cloudinary/Airtable trong một đêm. Khách bị chặn nhận thông báo
kèm số phút phải chờ và lời mời gọi điện đặt trực tiếp, không phải một lỗi cụt.

Bộ đếm dùng cửa sổ cố định trên KV — rẻ (1 đọc + 1 ghi mỗi lượt) nhưng KV chỉ "cuối cùng cũng
nhất quán", nên vài request bắn cùng lúc qua các máy chủ biên khác nhau có thể lọt thêm một
hai lượt. Ở quy mô một form đặt hàng thì không đáng đổi lấy Durable Object để đếm chính xác.

**4. Đặt biến môi trường trong Cloudflare Pages** (Settings → Environment variables). Lưu ý:
đây là biến cho *Function lúc chạy*, không phải chỉ cho lúc build, nên phải có mặt ở cả hai
môi trường Production và Preview:

```
AIRTABLE_TOKEN
AIRTABLE_BASE_ID
AIRTABLE_DESIGN_ORDERS_TABLE_ID   # bảng vừa tạo ở bước 1
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
TURNSTILE_SECRET_KEY              # tuỳ chọn, xem bên dưới
```

Thiếu bất kỳ biến bắt buộc nào (hoặc thiếu binding `KV_BINDING`) thì endpoint trả 503 kèm
thông báo lịch sự cho khách, và ghi tên thứ còn thiếu vào log của Pages (không lộ ra ngoài).

**5. Chống bot (tuỳ chọn).** Chưa đặt `TURNSTILE_SECRET_KEY` thì Function bỏ qua bước xác minh
và vẫn chạy bình thường; đặt vào là bật. Đây là lớp bổ sung cho hạn mức ở trên chứ không thay
thế: Turnstile chặn máy, hạn mức chặn cả người thật cố tình nghịch. Widget phía client chưa
gắn — khi bạn tạo widget Turnstile trên Cloudflare thì báo mình gắn nốt.

Luồng xử lý: **chặn spam** → đọc multipart → kiểm tra định dạng/kích thước (tối đa 10MB mỗi
file) → upload ảnh mẫu + logo gốc lên Cloudinary (ký SHA-1) → tạo record Airtable kèm link.

Thứ tự đó là cố ý: mọi bước tốn tài nguyên (đọc body, upload ảnh, gọi Airtable) đều nằm SAU
bước chặn spam, nên một kẻ bấm gửi liên tục chỉ tốn của mình đúng vài phép đọc KV. Kích thước
body còn bị chặn từ `Content-Length` trước cả khi đọc.

### Ảnh mẫu sản phẩm

`data/designTemplates.js` là chỗ DUY NHẤT khai báo mẫu: ảnh nào, ô chừa logo nằm đâu. Bộ vẽ
(`lib/designPreview.js`) không biết gì về sản phẩm, chỉ đọc các con số đó — thêm mẫu mới chỉ
cần thêm một mục vào mảng.

Ảnh nằm ở `public/assets/custom/`. Bản `.png` là ảnh gốc; site dùng bản `.jpg` (chất lượng 82)
vì ba file PNG cộng lại ~5MB, quá nặng cho một trang landing, trong khi bản JPEG còn ~740KB mà
mắt thường không phân biệt được. Tạo lại bản JPEG khi thay ảnh:

```bash
cd public/assets/custom
sips -s format jpeg -s formatOptions 82 temp_1.png --out mockup_1.jpg
```

Toạ độ ô chừa logo lấy bằng cách dò pixel trên chính file ảnh (tìm hình tròn xám/trắng in sẵn,
hoặc mép vùng trắng còn trống), không ước lượng bằng mắt. Ảnh chụp hơi nghiêng nên ô chừa được
mô tả bằng hình bình hành (`kind: 'quad'`) hoặc elip (`kind: 'ellipse'`) để logo nằm phẳng trên
mặt sản phẩm thay vì dán đè lên như sticker.

**Đổi màu nền.** Mẫu nào có thêm khoá `face` (đường bao mặt sản phẩm) thì khách đổi được màu
nền. Cách tô KHÔNG phải phủ một lớp màu lên ảnh: `tintMockup()` xét từng pixel và chỉ đổi
những pixel vừa sáng vừa trung tính — tức phần giấy trắng. Nhờ vậy mực in đen, logo Google 4
màu và ngôi sao vàng in sẵn đều giữ nguyên, còn bóng đổ và vệt sáng của ảnh chụp thì được bảo
toàn vì màu mới được nhân với độ sáng gốc của từng pixel.

Chỉ đặt `face` cho mẫu in **mực đen trên nền trắng**. Mẫu đã có màu sẵn (Google xanh) thì màu
nằm chết trong ảnh chụp, không tách ra để thay được — bỏ khoá `face` là mục chọn màu tự ẩn.

Bảng màu gợi ý (`bgPresets`) cố tình chỉ có tông sáng: mã QR và chữ trên mẫu đều in mực đen nên
nền tối sẽ làm QR không quét được. Khách vẫn tự chọn màu bất kỳ, chỉ là có cảnh báo khi quá tối
(ngưỡng `MIN_BG_LUMINANCE`).

Nếu Airtable lỗi (vd sai tên cột lúc mới cấu hình), ảnh đã nằm sẵn trên Cloudinary và link
được ghi vào log kèm mã đơn + số điện thoại, nên đơn không mất trắng.

**Chạy thử tại máy** (có cả Function, khác `npx serve out` vốn chỉ phục vụ file tĩnh):

```bash
npm run build
npx wrangler pages dev out
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
