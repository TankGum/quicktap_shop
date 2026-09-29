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
//
// `mobileSrc` (không bắt buộc): bản dọc cho màn hẹp. Trình duyệt chọn một trong hai <source>
// ngay lúc tải trang theo thuộc tính media — chỉ tải đúng một file, không tải cả hai. Bản
// NGANG đứng trước và mang điều kiện min-width: trình duyệt đời cũ bỏ qua `media` sẽ lấy
// <source> đầu tiên, tức là bản ngang, nên desktop không bao giờ nhận nhầm video dọc.
// Mốc 640px phải khớp media query của .video-showcase-media.has-mobile trong globals.css.

import { useEffect, useRef, useState } from 'react';

const DESKTOP_MEDIA = '(min-width: 640px)';

export default function HeroVideo({ src, mobileSrc, poster, alt, lazy = false }) {
  const ref = useRef(null);
  // lazy: chưa gắn nguồn video cho tới khi khối cuộn tới gần (cách 500px) — dùng cho video ở
  // cuối trang. Không có IntersectionObserver thì gắn ngay.
  const [armed, setArmed] = useState(!lazy);
  useEffect(() => {
    if (armed) return;
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) { setArmed(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setArmed(true); io.disconnect(); } }, { rootMargin: '500px' });
    io.observe(el);
    return () => io.disconnect();
  }, [armed]);
  // <video> đã có sẵn trong DOM khi nguồn mới được gắn nên phải gọi load() để nó bắt đầu tải.
  useEffect(() => { if (lazy && armed) ref.current?.load(); }, [lazy, armed]);

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
      src={armed && !mobileSrc ? src : undefined}
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
    >
      {armed && mobileSrc && <source src={src} media={DESKTOP_MEDIA} type="video/mp4" />}
      {armed && mobileSrc && <source src={mobileSrc} type="video/mp4" />}
    </video>
  );
}
