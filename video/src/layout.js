import { useVideoConfig } from 'remotion';

// Cùng một bộ cảnh render ra hai bản: ngang 1920×1080 (desktop) và dọc 1080×1920 (mobile).
// Mỗi cảnh khai bố cục cho cả hai hướng ở đầu file và lấy bản đúng qua useLayout().
export function useLayout() {
  const { width, height } = useVideoConfig();
  const portrait = height > width;
  return { portrait, W: width, H: height, pick: (spec) => spec[portrait ? 'portrait' : 'landscape'] };
}

// Tư thế mở màn của standee Google. Cảnh cuối đưa standee về ĐÚNG tư thế này ở khung hình
// cuối, nên khi video lặp lại, khung cuối nối liền khung đầu — và khung đầu (thứ trình duyệt
// hiện trước khi video chạy, hoặc khi khách bật "giảm chuyển động") không phải nền trống.
export const OPENING = {
  landscape: { x: 1180, y: 560, mm: 3.3, rx: -14, ry: -40 },
  portrait: { x: 540, y: 1170, mm: 4.4, rx: -14, ry: -40 },
};
