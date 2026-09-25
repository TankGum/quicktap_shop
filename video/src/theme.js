import { loadFont } from '@remotion/google-fonts/Inter';

// Cùng bộ màu với app/globals.css để video liền mạch với trang chủ.
export const C = {
  bg: '#f5f5f7',
  ink: '#1d1d1f',
  ink2: '#515154',
  ink3: '#86868b',
  accent: '#0071e3',
  star: '#f5a524',
  line: '#d2d2d7',
};

// Site dùng Inter làm font dự phòng sau SF Pro; SF Pro không có sẵn trong Chrome headless
// nên video dùng thẳng Inter. Phải nạp subset vietnamese, không thì dấu tiếng Việt rơi về
// font hệ thống và lệch nét với phần còn lại của chữ.
export const { fontFamily } = loadFont('normal', {
  weights: ['500', '600', '700'],
  subsets: ['latin', 'vietnamese'],
});
