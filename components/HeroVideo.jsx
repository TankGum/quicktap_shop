'use client';

// Video: tự phát, câm tiếng, lặp lại — hoạt động ngay cả khi JS chưa chạy vì
// autoplay/muted/loop là thuộc tính HTML thuần. Sau khi JS chạy, nếu khách bật
// "giảm hiệu ứng chuyển động" trên máy thì dừng lại ở khung hình đầu (poster/frame
// đầu), không ép chuyển động liên tục.
//
// Khung hình: video được hiện ĐÚNG TỈ LỆ GỐC của nó. Trước đây CSS ép sẵn một tỉ lệ (16/9 cho
// video "Cách hoạt động", 1920/946 cho video sản phẩm) kèm object-fit: cover — video nào quay
// ở tỉ lệ khác là bị cắt cụt hai bên hoặc trên dưới. Giờ đọc tỉ lệ thật từ chính file video
// rồi gán vào, nên upload video dọc hay ngang gì cũng hiện trọn, không phải sửa CSS.

import { useEffect, useRef, useState } from 'react';

export default function HeroVideo({ src, poster, alt }) {
  const ref = useRef(null);
  const [ratio, setRatio] = useState(null);

  const readRatio = (el) => {
    if (el?.videoWidth && el?.videoHeight) setRatio(`${el.videoWidth} / ${el.videoHeight}`);
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) el.pause();

    // Metadata có thể đã tải xong TRƯỚC khi React gắn onLoadedMetadata (video trong cache) —
    // khi đó sự kiện không bao giờ chạy và tỉ lệ sẽ kẹt ở giá trị dự phòng trong CSS.
    // readyState >= HAVE_METADATA nghĩa là đã biết kích thước.
    if (el.readyState >= 1) readRatio(el);
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={alt}
      onLoadedMetadata={(e) => readRatio(e.currentTarget)}
      // Đè lên tỉ lệ dự phòng khai báo trong globals.css.
      style={ratio ? { aspectRatio: ratio } : undefined}
    />
  );
}
