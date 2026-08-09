'use client';

// Video hero: tự phát, câm tiếng, lặp lại — hoạt động ngay cả khi JS chưa chạy vì
// autoplay/muted/loop là thuộc tính HTML thuần. Sau khi JS chạy, nếu khách bật
// "giảm hiệu ứng chuyển động" trên máy thì dừng lại ở khung hình đầu (poster/frame
// đầu), không ép chuyển động liên tục.

import { useEffect, useRef } from 'react';

export default function HeroVideo({ src, poster, alt }) {
  const ref = useRef(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) ref.current?.pause();
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
      preload="auto"
      aria-label={alt}
    />
  );
}
