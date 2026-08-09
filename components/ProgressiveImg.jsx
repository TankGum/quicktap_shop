'use client';

// <img> hiện dần lên khi tải xong (xem .img-fade trong globals.css) — tránh ảnh nhấp nháy
// hay giật layout. Dùng thay cho <img> thường ở mọi nơi hiển thị ảnh sản phẩm/mẫu thật.

import { useEffect, useRef, useState } from 'react';

export default function ProgressiveImg({ alt = '', className = '', loading = 'lazy', onLoad, ...rest }) {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef(null);

  // Ảnh đã nằm sẵn trong cache có thể tải xong TRƯỚC khi React gắn onLoad — khi đó sự kiện
  // không bao giờ chạy và ảnh sẽ kẹt ở opacity:0. Kiểm tra .complete ngay khi gắn vào DOM.
  useEffect(() => {
    if (ref.current?.complete) setLoaded(true);
  }, []);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      alt={alt}
      className={['img-fade', loaded ? 'is-loaded' : '', className].filter(Boolean).join(' ')}
      loading={loading}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
      {...rest}
    />
  );
}
