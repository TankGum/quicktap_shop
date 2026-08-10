import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileCta from '@/components/MobileCta';
import { siteConfig } from '@/lib/siteConfig';

export const metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: `${siteConfig.brandName} — Bảng NFC & standee QR giúp quán tăng đánh giá 5 sao chỉ với 1 chạm`,
    template: `%s — ${siteConfig.brandName}`,
  },
  description:
    'Bảng NFC 10x10cm (chip NFC + QR) dán tường/quầy và standee QR đặt tại quầy thu ngân. Khách chạm điện thoại hoặc quét mã là mở thẳng trang đánh giá Google Maps, Booking.com, TripAdvisor — không cần tìm tên quán, không cần cài app.',
  applicationName: siteConfig.brandName,
  icons: {
    icon: '/favicon.svg',
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

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning: thẻ script ngay dưới đây gắn class "js" vào <html> TRƯỚC khi
    // React hydrate, nên HTML từ server (chưa có class) và DOM lúc hydrate (đã có) lệch nhau
    // — cố ý, không phải lỗi. Không thể render sẵn class này từ server: `.js .reveal` ẩn nội
    // dung đi chờ hiệu ứng cuộn, ai tắt JS sẽ nhìn thấy trang trắng vĩnh viễn.
    // Thuộc tính này chỉ bỏ qua cảnh báo cho đúng thẻ <html>, con bên trong vẫn được kiểm tra.
    <html lang="vi" suppressHydrationWarning>
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
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <MobileCta />
      </body>
    </html>
  );
}
