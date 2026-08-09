/** @type {import('next').NextConfig} */
const nextConfig = {
  // Xuất static HTML/CSS/JS thuần — không cần Node server, deploy được lên
  // Cloudflare Pages hoặc bất kỳ static host nào. `npm run build` -> thư mục `out/`.
  output: 'export',
  images: { unoptimized: true },
};

module.exports = nextConfig;
