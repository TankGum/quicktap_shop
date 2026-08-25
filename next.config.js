/** @type {import('next').NextConfig} */
const nextConfig = {
  // Xuất static HTML/CSS/JS thuần — không cần Node server, deploy được lên
  // Cloudflare Pages hoặc bất kỳ static host nào. `npm run build` -> thư mục `out/`.
  output: 'export',
  images: { unoptimized: true },
  // Mặc định vẫn là '.next' y như trước — deploy không đổi gì. Đặt biến môi trường để build
  // ra thư mục khác khi đang chạy `next dev`: hai bên dùng chung '.next' sẽ giẫm lên nhau và
  // làm hỏng phiên dev đang chạy (lỗi kiểu "Cannot find module './611.js'").
  //   NEXT_DIST_DIR=.next-verify npx next build
  distDir: process.env.NEXT_DIST_DIR || '.next',
};

module.exports = nextConfig;
