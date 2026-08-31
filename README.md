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

Vì sao phải có nó: site là static export nên không có API route của Next; mà ghi kho dữ liệu
thì cần khoá bí mật (Cloudinary), gọi thẳng từ trình duyệt là công khai khoá đó cho bất kỳ ai
mở DevTools.

Đơn **từng lưu ở Airtable, nay lưu ở D1** — cùng nhà với Pages, nên không còn token có quyền
đọc/ghi TOÀN BỘ base Airtable nằm trong môi trường chạy, và lúc khách bấm gửi không còn phụ
thuộc một dịch vụ ngoài. Airtable vẫn giữ nguyên vai trò cũ ở chỗ khác: nguồn dữ liệu sản
phẩm/ảnh đọc **lúc build** (`lib/airtable.js`) — phần đó không đổi gì.

**1. D1 database.** Đang dùng database `quicktap-orders`
(`e6ed458c-b10b-467e-a983-7036a5be91e2`), bảng `design_orders`. Schema là
[`d1/schema.sql`](d1/schema.sql) — chạy lại lúc nào cũng an toàn (`IF NOT EXISTS`):

```bash
npm run d1:schema         # tạo/cập nhật bảng trên D1 THẬT
npm run d1:schema:local   # bản D1 ở máy, dùng cho `npm run preview`
```

| Cột | Kiểu | Nội dung |
| --- | --- | --- |
| `id` | INTEGER PK | tự tăng |
| `code` | TEXT UNIQUE | mã đơn (`TK-8F3K`) — hiện cho khách, cũng là tên file trên Cloudinary |
| `customer_name` | TEXT | tên quán |
| `phone` | TEXT | số điện thoại |
| `quantity` | INTEGER | số lượng |
| `notes` | TEXT | ghi chú của khách, có thể rỗng |
| `cloudinary_link` | TEXT | link ảnh mẫu khách đã chốt |
| `order_date` | TEXT | ISO 8601 (UTC), vd `2026-08-31T02:47:05.777Z` |

Đúng những thông tin bảng Airtable cũ có, chỉ đổi tên sang snake_case, thêm cột `code` (thời
Airtable mã đơn chỉ nằm trong tên file Cloudinary; ở SQL nó là khoá tự nhiên để tra đơn khi
khách gọi điện đọc mã).

Xem đơn (D1 không có giao diện lưới như Airtable — dùng lệnh, hoặc Cloudflare Dashboard →
Storage & Databases → D1 → `quicktap-orders` → Console):

```bash
npm run d1:orders   # 20 đơn mới nhất
```

Ảnh lưu bằng LINK chứ không nhét vào database: file chỉ nằm đúng một chỗ (Cloudinary), không
bơm phồng D1, và link Cloudinary thì vĩnh viễn.

KHÔNG lưu mã màu nền, tên mẫu hay loại sản phẩm — cả ba đều nhìn thấy ngay trong ảnh mẫu.

**Chỉ ảnh mẫu được tải lên, không có file logo gốc.** Bảng có đúng một cột link, mà logo có thể
nặng tới 10MB — bắt khách tải lên một thứ rồi vứt đi là vô lý. Nếu sau này cần logo gốc để lên
bản in, thêm cột `logo_url` vào `d1/schema.sql` rồi mở lại phần đã ghi chú trong
`functions/api/thiet-ke-rieng.js` và `components/DesignStudio.jsx`.

**Kiểm tra thông tin khách nhập.** Luật nằm ở [`lib/orderValidation.js`](lib/orderValidation.js)
và được dùng **chung** cho cả form lẫn Function — một file để hai bên không bao giờ lệch nhau
(lệch thì hoặc form hứa hẹn hợp lệ rồi server trả 400, hoặc khách bị chặn bằng lỗi mà form
không giải thích được). Client kiểm tra trước để báo lỗi ngay dưới ô nhập, còn Function mới là
chốt chặn thật: JS trong trình duyệt ai cũng sửa được, một cú `curl` là bỏ qua sạch.

| Ô | Luật |
| --- | --- |
| Tên quán | bắt buộc, ≥ 2 ký tự, phải có ít nhất một chữ cái (toàn số = gõ nhầm ô) |
| Số điện thoại | bắt buộc, số VN: di động `0[3\|5\|7\|8\|9]` + 8 số, hoặc cố định `02` + 8–9 số |
| Số lượng | số nguyên 1–9999 |
| Ghi chú | tối đa 2000 ký tự (đo sau khi gộp khoảng trắng) |

Số điện thoại được **chuẩn hoá** trước khi ghi: `+84 388 102 842`, `(028) 3822 1234`,
`0084…` đều về dạng `0388102842`. Nếu không thì cùng một quán nằm trong D1 dưới hai kiểu viết
và lúc tra số gọi lại sẽ không khớp. Form gửi lên bản đã chuẩn hoá, Function chuẩn hoá lại lần
nữa (không tin dữ liệu từ client).

Sai thì Function trả **400** kèm `message` (lỗi đầu tiên) và `errors` (đủ cả, khoá theo tên ô).

**2. Hai binding trong Pages** (Settings → Functions), nhớ làm cho **cả Production lẫn
Preview** — bind thiếu một môi trường thì môi trường đó trả 503:

| Binding | Loại | Trỏ tới |
| --- | --- | --- |
| `DB` | D1 database binding | `quicktap-orders` |
| `KV_BINDING` | KV namespace binding | namespace bất kỳ, dùng để đếm hạn mức |

KV là **bắt buộc**: thiếu nó thì endpoint vẫn chạy nhưng không còn gì chặn spam, tức là hỏng
đúng thứ đang cần bảo vệ mà nhìn từ ngoài lại tưởng bình thường. Nên Function trả 503 luôn nếu
chưa có.

Hạn mức đang đặt (sửa ở đầu `functions/api/thiet-ke-rieng.js`):

| Phạm vi | Mức |
| --- | --- |
| 1 IP | 3 đơn / 10 phút |
| 1 IP | 10 đơn / ngày |
| Toàn bộ endpoint | 200 đơn / ngày |

Trần tổng là cái van cuối: IP thì đổi được (VPN, botnet), nên cần một mức chặn không phụ thuộc
IP để không ai đốt được hoá đơn Cloudinary (hay bơm đầy D1) trong một đêm. Khách bị chặn nhận
thông báo kèm số phút phải chờ và lời mời gọi điện đặt trực tiếp, không phải một lỗi cụt.

Bộ đếm dùng cửa sổ cố định trên KV — rẻ (1 đọc + 1 ghi mỗi lượt) nhưng KV chỉ "cuối cùng cũng
nhất quán", nên vài request bắn cùng lúc qua các máy chủ biên khác nhau có thể lọt thêm một
hai lượt. Ở quy mô một form đặt hàng thì không đáng đổi lấy Durable Object để đếm chính xác.

**3. Biến môi trường trong Pages** (Settings → Environment variables). Đây là biến cho
*Function lúc chạy*, nên phải có mặt ở cả Production lẫn Preview:

```
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
TELEGRAM_BOT_TOKEN                # tuỳ chọn, xem bước 4
TELEGRAM_CHAT_ID                  # tuỳ chọn, xem bước 4
TURNSTILE_SECRET_KEY              # tuỳ chọn, xem bước 5
```

Thiếu bất kỳ biến **bắt buộc** nào (hoặc thiếu binding `DB` / `KV_BINDING`) thì endpoint trả
503 kèm thông báo lịch sự cho khách, và ghi tên thứ còn thiếu vào log của Pages (không lộ ra
ngoài). Ba biến `AIRTABLE_*` cũ dùng cho bảng đơn thì **xoá được** khỏi Pages — Function không
đọc chúng nữa; `AIRTABLE_TOKEN`/`AIRTABLE_BASE_ID` vẫn cần cho *bước build*.

**4. Báo đơn mới qua Telegram.** Có đơn là bot nhắn cho bạn: mã đơn, tên quán, số điện thoại,
số lượng, ghi chú, giờ Việt Nam, và link ảnh mẫu ở dòng cuối (Telegram tự dựng ảnh xem trước,
nên mở thông báo là thấy luôn mẫu khách chốt).

1. Nhắn [@BotFather](https://t.me/BotFather) → `/newbot` → đặt tên → nhận **token**.
2. Nhắn một tin bất kỳ cho chính con bot vừa tạo (bot không nhắn trước được cho người lạ).
3. Mở `https://api.telegram.org/bot<TOKEN>/getUpdates`, lấy số ở `message.chat.id` → đó là
   **chat id**. Muốn báo vào một nhóm thì thêm bot vào nhóm, nhắn một tin trong nhóm rồi lấy
   `chat.id` của nhóm (số âm).
4. Đặt `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` ở bước 3, deploy lại.

Chưa đặt hai biến này thì Function bỏ qua bước báo và **vẫn nhận đơn bình thường** (ghi một
dòng cảnh báo vào log). Báo Telegram cũng không bao giờ làm rớt đơn: tới lúc đó đơn đã nằm
trong D1 rồi, Telegram lỗi thì chỉ ghi log — báo trượt mà trả "gửi thất bại" cho khách để họ
gửi lại là hỏng cái phụ kéo theo cái chính. Tin nhắn chạy trong `waitUntil` nên khách không
phải đợi thêm một vòng gọi mạng.

**5. Chống bot (tuỳ chọn).** Chưa đặt `TURNSTILE_SECRET_KEY` thì Function bỏ qua bước xác minh
và vẫn chạy bình thường; đặt vào là bật. Đây là lớp bổ sung cho hạn mức ở trên chứ không thay
thế: Turnstile chặn máy, hạn mức chặn cả người thật cố tình nghịch. Widget phía client chưa
gắn — khi bạn tạo widget Turnstile trên Cloudflare thì báo mình gắn nốt.

Luồng xử lý: **chặn spam** → đọc multipart → kiểm tra định dạng/kích thước (tối đa 10MB mỗi
file) → upload ảnh mẫu lên Cloudinary (ký SHA-1) → ghi một dòng vào D1 kèm link → báo Telegram.

Thứ tự đó là cố ý: mọi bước tốn tài nguyên (đọc body, upload ảnh, ghi D1) đều nằm SAU bước
chặn spam, nên một kẻ bấm gửi liên tục chỉ tốn của mình đúng vài phép đọc KV. Kích thước body
còn bị chặn từ `Content-Length` trước cả khi đọc.

> `d1/wrangler.jsonc` cố ý nằm trong `d1/` chứ không phải gốc repo: Pages đọc `wrangler.jsonc`
> **ở gốc** và khi có file đó thì bỏ qua toàn bộ biến môi trường + binding đã đặt trong
> Dashboard — đặt ở gốc là âm thầm gỡ mất `KV_BINDING` và khoá Cloudinary của bản deploy thật.

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

**Tự lấy màu nền theo logo.** Tải logo lên là nền tự đổi theo tông chủ đạo của logo đó
(`dominantTint()` trong `lib/designPreview.js`). KHÔNG lấy thẳng màu logo làm nền — logo xanh
navy hay đỏ đô sẽ cho ra nền tối và hỏng mực in đen — mà chỉ mượn *tông màu*, còn độ sáng thì
ép về mức của `bgPresets` (`TINT_LIGHTNESS`).

Cách tìm màu: bỏ pixel trong suốt, gần trắng, gần đen và pixel xám (logo thường là chữ đen cộng
một màu thương hiệu — cần cái màu đó, không phải đám mực đen chiếm nhiều diện tích hơn), rồi gom
theo từng khoảng hue và chọn khoảng nặng nhất. Gom khoảng chứ không lấy trung bình toàn ảnh, vì
logo hai màu mà lấy trung bình sẽ ra một màu xám không có trong logo.

Quy tắc ghi đè: logo mới có màu thì lấy màu mới; logo đen trắng thì trả nền về trắng NẾU màu
đang dùng là màu máy tự lấy từ logo trước, còn màu do khách tự chọn thì không đụng vào.

Nếu D1 lỗi (vd chưa chạy `d1/schema.sql` nên chưa có bảng), ảnh đã nằm sẵn trên Cloudinary và
link được ghi vào log kèm mã đơn + số điện thoại, nên đơn không mất trắng.

### Chạy thử & dò lỗi

**`npm run dev` KHÔNG phục vụ endpoint này.** Next dev server không biết gì về thư mục
`functions/` — đó là Pages Function của Cloudflare. Gọi `localhost:3000/api/thiet-ke-rieng` sẽ
ra 404 hoặc "Server action not found"; đó là hành vi đúng, không phải lỗi.

Muốn chạy thử có cả Function (nhớ tắt `npm run dev` trước — hai bên dùng chung thư mục `.next`
nên chạy song song sẽ giẫm lên nhau):

```bash
npm run d1:schema:local   # 1 lần: tạo bảng trong bản D1 ở máy (.wrangler/state)
npm run preview           # = next build && wrangler pages dev out --kv KV_BINDING --d1 DB=<id>
```

Wrangler tự nạp `.env.local`. D1 lúc này là **bản ở máy** (`.wrangler/state`) nên đơn thử
không lẫn vào D1 thật — nhưng ảnh thì vẫn upload THẬT lên Cloudinary, và Telegram cũng nhắn
thật nếu bạn đã điền token trong `.env.local`.

**Dò lỗi cấu hình:** mở thẳng `/api/thiet-ke-rieng` bằng trình duyệt (GET). Nó trả về đúng danh
sách khoá còn thiếu của môi trường đang chạy — chỉ TÊN khoá, không bao giờ trả giá trị:

```json
{ "ready": false, "missing": ["DB"], "off": ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"] }
```

`missing` là thứ **bắt buộc** còn thiếu (endpoint đang 503). `off` là tính năng tuỳ chọn đang
tắt — không phải lỗi, nhưng thiếu `TELEGRAM_*` thì đơn về mà điện thoại im lặng, đúng kiểu
hỏng không ai nhận ra cho tới lúc mất một đơn.

**Bị 503 trên production?** Gần như luôn là một trong bốn nguyên nhân này:

1. Đổi biến/thêm binding xong nhưng **chưa deploy lại**. Cấu hình chỉ áp cho bản deploy MỚI;
   bản đang chạy vẫn giữ nguyên cấu hình lúc nó được tạo.
2. Chỉ đặt cho **Preview** mà không đặt cho **Production** (hoặc ngược lại).
3. Tạo KV namespace / D1 database rồi nhưng **chưa bind** vào project ở Settings → Functions,
   với đúng tên `KV_BINDING` và `DB`.
4. Gõ sai tên biến.

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
