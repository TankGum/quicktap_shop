import { Inter } from 'next/font/google';
import './globals.css';

// Chữ trên máy KHÔNG phải Apple. Máy Apple đã có sẵn SF Pro thật qua -apple-system (xem --font
// trong globals.css); còn Android/Windows trước đây rơi về Roboto/Segoe UI, khác hẳn SF. Inter
// là bản thay thế mở gần SF Pro Text nhất và có đủ dấu tiếng Việt.
//
// SF Pro KHÔNG thể tự host: giấy phép của Apple chỉ cho dùng để phát triển ứng dụng trên nền
// tảng Apple, không cho nhúng vào website.
//
// next/font TẢI SẴN file font lúc build rồi phục vụ từ chính tên miền của mình — không có
// request nào ra CDN ngoài lúc chạy, đúng nguyên tắc của dự án (xem README).
const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  // Hiện chữ bằng font dự phòng ngay rồi đổi khi font tải xong, thay vì để trống chữ.
  display: 'swap',
  variable: '--font-inter',
});
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ZaloButton from '@/components/ZaloButton';
import ChatWidget from '@/components/ChatWidget';
import { CartProvider } from '@/components/CartStore';
import { siteConfig } from '@/lib/siteConfig';
import { products } from '@/data/products';
import { getVariantsByProduct } from '@/lib/airtable';

export const metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    // Từ khoá đứng TRƯỚC tên thương hiệu: người Việt gõ "bảng nfc đánh giá google maps",
    // gần như không ai gõ "quicktapreview" — mà tên đó còn trùng với một site Mỹ cùng ngành
    // đã lên top từ lâu, nên đặt cược vào từ khoá thương hiệu là cầm chắc thua.
    // Giữ dưới ~60 ký tự để Google không cắt cụt tiêu đề trên trang kết quả.
    default: `Bảng NFC & standee QR đánh giá Google Maps — ${siteConfig.brandName}`,
    template: `%s — ${siteConfig.brandName}`,
  },
  description:
    'Bảng NFC 10x10cm (chip NFC + QR) dán tường/quầy và standee QR đặt tại quầy thu ngân. Khách chạm điện thoại hoặc quét mã là mở thẳng trang đánh giá Google Maps, Booking.com, TripAdvisor — không cần tìm tên quán, không cần cài app.',
  applicationName: siteConfig.brandName,
  // Nói thẳng với Google là được phép index. Mặc định không có thẻ này thì Google vẫn index,
  // nhưng `max-image-preview: large` là thứ phải khai rõ mới có — nó cho phép hiện ảnh lớn
  // kèm kết quả tìm kiếm, thứ quyết định tỉ lệ bấm vào với một site bán hàng nhìn bằng ảnh.
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  // Chỉ in thẻ xác minh khi đã có mã — Next bỏ qua hẳn `verification` nếu giá trị rỗng.
  ...(siteConfig.googleSiteVerification
    ? { verification: { google: siteConfig.googleSiteVerification } }
    : {}),
  icons: {
    // Thiếu `type` khiến vài trình duyệt không nhận SVG làm favicon rồi âm thầm rơi về
    // /favicon.ico (trước đây chưa có file này nên 404, tab hiện icon mặc định trống).
    // app/favicon.ico (quy ước file của Next.js App Router) giờ lo phần fallback đó —
    // không cần khai báo tay ở đây, Next tự thêm <link rel="icon" href="/favicon.ico">.
    icon: { url: '/favicon.svg', type: 'image/svg+xml' },
    apple: '/assets/img/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: siteConfig.locale,
    siteName: siteConfig.brandName,
    url: '/',
    images: [{ url: siteConfig.defaultOgImage, width: 1200, height: 630, alt: 'Bảng NFC và standee QR đặt tại quầy thu ngân của quán' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: [siteConfig.defaultOgImage],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  // Site chỉ có giao diện sáng (xem ghi chú trong app/globals.css) nên thanh trình duyệt
  // trên mobile cũng luôn màu trắng, không đổi theo cài đặt tối của máy.
  colorScheme: 'light',
  themeColor: '#ffffff',
};

export default async function RootLayout({ children }) {
  // Ảnh tiêu biểu cho từng dòng sản phẩm, để menu "Sản phẩm" (cả dropdown ở header lẫn danh
  // sách trong sidebar) hiện được ảnh nhỏ bên cạnh tên. Header là Client Component nên KHÔNG
  // tự gọi Airtable được — layout (Server Component) đọc sẵn rồi truyền xuống dạng chuỗi.
  // getVariantsByProduct có cache riêng nên trang chủ gọi lại cũng không tốn thêm request.
  const variantsByProduct = await getVariantsByProduct();
  const productLinks = products.map((p) => ({
    href: p.href,
    label: p.title,
    // Lấy mẫu ĐẦU TIÊN có ảnh, giống cách trang chủ chọn ảnh giới thiệu cho mỗi dòng.
    // Airtable chưa có mẫu nào kèm ảnh thì để null — menu tự bỏ ô ảnh, chỉ còn tên.
    image: (variantsByProduct[p.id] || []).find((v) => v.image)?.image || null,
  }));

  return (
    // suppressHydrationWarning: thẻ script ngay dưới đây gắn class "js" vào <html> TRƯỚC khi
    // React hydrate, nên HTML từ server (chưa có class) và DOM lúc hydrate (đã có) lệch nhau
    // — cố ý, không phải lỗi. Không thể render sẵn class này từ server: `.js .reveal` ẩn nội
    // dung đi chờ hiệu ứng cuộn, ai tắt JS sẽ nhìn thấy trang trắng vĩnh viễn.
    // Thuộc tính này chỉ bỏ qua cảnh báo cho đúng thẻ <html>, con bên trong vẫn được kiểm tra.
    <html lang="vi" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Đánh dấu JS đã chạy trước khi trang vẽ khung hình đầu, để hiệu ứng
            "hiện dần khi cuộn" (.reveal) chỉ áp dụng khi JS thực sự hoạt động —
            nếu không, người dùng không JS vẫn đọc được nội dung đầy đủ. */}
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js');" }}
        />
      </head>
      <body>
        <a className="skip-link" href="#main">Bỏ qua tới nội dung chính</a>
        {/* CartProvider phải bọc CẢ Header lẫn main: huy hiệu số lượng nằm trên header, còn
            nút thêm vào giỏ nằm trong trang — hai chỗ phải đọc cùng một state. */}
        <CartProvider>
          <Header productLinks={productLinks} />
          <main id="main">{children}</main>
        </CartProvider>
        <Footer />
        {/* Hai nút nổi ở góc phải dưới, xếp dọc (xem .chat-fab/.zalo-fab trong
            globals.css): chat trả lời ngay bằng máy, Zalo để người thật trả lời sau.
            ChatWidget là client component nên khi JS không chạy nó không render gì —
            nút Zalo vẫn còn, trang không mất kênh liên hệ nào. */}
        <ChatWidget />
        <ZaloButton />
      </body>
    </html>
  );
}
