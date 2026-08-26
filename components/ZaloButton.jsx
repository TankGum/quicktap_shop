import { siteConfig } from '@/lib/siteConfig';

// Nút Zalo nổi ở góc phải dưới, có mặt trên MỌI trang (gắn trong app/layout.js).
// Là link tĩnh nên để server component — không cần JS phía client, không tốn bundle.
export default function ZaloButton() {
  return (
    <a
      className="zalo-fab"
      href={siteConfig.zaloHref}
      target="_blank"
      // noopener chặn tab Zalo vừa mở với tới window.opener của mình; noreferrer để
      // không gửi kèm địa chỉ trang đang xem.
      rel="noopener noreferrer"
      aria-label="Nhắn tin Zalo cho QuickTapReview"
    >
      <span className="zalo-fab-pulse" aria-hidden="true" />
      {/* Logo Zalo chính thức, tự host trong public/ như các logo thương hiệu khác —
          không gọi ra CDN ngoài (xem README). Nền nút trùng đúng màu xanh #0068FF của
          logo nên phần xanh trong hình hoà vào nút, chỉ còn bong bóng trắng nổi lên,
          đúng như icon ứng dụng Zalo. Chữ "Zalo" nằm sẵn trong logo nên nút không cần
          thêm nhãn chữ nữa — aria-label ở trên lo phần đọc màn hình. */}
      <img
        className="zalo-fab-logo"
        src="/assets/logo_brands/zalo.svg"
        alt=""
        width="44"
        height="44"
        // Nút nằm ngay khung nhìn đầu tiên: tải chậm sẽ thấy nút rỗng một nhịp.
        loading="eager"
        decoding="async"
      />
    </a>
  );
}
