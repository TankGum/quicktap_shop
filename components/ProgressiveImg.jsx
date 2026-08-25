'use client';

// <img> hiện dần lên khi tải xong (xem .img-fade trong globals.css) — tránh ảnh nhấp nháy
// hay giật layout. Dùng thay cho <img> thường ở mọi nơi hiển thị ảnh sản phẩm/mẫu thật.
//
// Kiểu hiện: ảnh nét dần từ mờ và thu nhẹ về đúng cỡ ("blur-up"), thay cho kiểu chỉ tăng độ
// đục phẳng lì trước đây — ảnh sản phẩm hiện ra như ảnh bìa tạp chí chứ không như ô ảnh đang
// nạp. Toàn bộ phần chuyển động nằm ở .img-fade trong globals.css.
//
// Ảnh sản phẩm còn được lấy ĐÚNG CỠ theo màn hình, xem buildSrcSet bên dưới.

import { useEffect, useRef, useState } from 'react';

// Các bề rộng sẽ chào cho trình duyệt chọn. Đủ dày để máy nào cũng có bản vừa vặn (kể cả màn
// hình 2x), nhưng không dày quá — mỗi mốc là một biến thể Cloudinary phải sinh ra và lưu.
const WIDTHS = [320, 480, 640, 960, 1280, 1600];

// Ảnh gốc trên Cloudinary là PNG 1200-1500px, mỗi tấm ~1,5 MB; 8 tấm ngoài trang chủ là ~11,5 MB
// tải về chỉ để hiển thị ở khung vài trăm px. Chèn tham số biến đổi vào URL để Cloudinary trả
// bản đã nén đúng cỡ: cùng tấm ảnh đó ở w_640 chỉ còn ~32 KB (đã đo).
//
//   f_auto  - tự chọn định dạng tốt nhất trình duyệt đọc được (WebP/AVIF thay cho PNG)
//   q_auto  - tự chọn mức nén theo nội dung ảnh
//   c_limit - CHỈ thu nhỏ, không phóng to: ảnh gốc nhỏ hơn mốc thì giữ nguyên, không làm vỡ ảnh
//
// URL không phải của Cloudinary (vd logo nền tảng trong /public) thì trả về null — nơi gọi sẽ
// bỏ qua srcset và dùng nguyên src như cũ.
function buildSrcSet(src) {
  if (typeof src !== 'string') return null;
  const marker = '/image/upload/';
  const at = src.indexOf(marker);
  if (at === -1) return null;

  const head = src.slice(0, at + marker.length);
  const tail = src.slice(at + marker.length);
  return WIDTHS.map((w) => `${head}f_auto,q_auto,c_limit,w_${w}/${tail} ${w}w`).join(', ');
}

export default function ProgressiveImg({
  src,
  alt = '',
  className = '',
  loading = 'lazy',
  // Cho trình duyệt biết ảnh sẽ chiếm bao nhiêu bề ngang màn hình, để nó chọn đúng mốc trong
  // srcset. Không truyền thì đoán an toàn là chiếm cả bề ngang — thà tải dư còn hơn ảnh vỡ.
  sizes = '100vw',
  onLoad,
  ...rest
}) {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef(null);

  // Ảnh đã nằm sẵn trong cache có thể tải xong TRƯỚC khi React gắn onLoad — khi đó sự kiện
  // không bao giờ chạy và ảnh sẽ kẹt ở opacity:0. Kiểm tra .complete ngay khi gắn vào DOM.
  useEffect(() => {
    if (ref.current?.complete) setLoaded(true);
  }, []);

  const srcSet = buildSrcSet(src);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      srcSet={srcSet || undefined}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      className={['img-fade', loaded ? 'is-loaded' : '', className].filter(Boolean).join(' ')}
      loading={loading}
      // Giải mã ảnh ở luồng nền: ảnh sản phẩm ở đây đều là ảnh lớn, giải mã đồng bộ sẽ chặn
      // luồng chính đúng lúc ảnh hiện ra và làm khựng chính hiệu ứng nét dần bên trên.
      decoding="async"
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
      {...rest}
    />
  );
}
