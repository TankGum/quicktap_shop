// Các loại hình phù hợp, cho mục "Phù hợp với" ở trang chủ (và danh sách ngành trong kb.json
// cho chatbot). Mỗi `id` có một cảnh minh hoạ SVG tương ứng trong components/IndustryArt.jsx —
// thêm ngành mới thì vẽ thêm cảnh ở đó, thiếu cảnh thì ô hiện trống phần hình.

export const industries = [
  {
    id: 'hotel',
    label: 'Khách sạn',
  },
  {
    id: 'homestay',
    label: 'Homestay',
  },
  {
    id: 'restaurant',
    label: 'Nhà hàng',
  },
  {
    id: 'cafe',
    label: 'Quán cà phê',
  },
  {
    id: 'spa',
    label: 'Spa & làm đẹp',
  },
  {
    id: 'shop',
    label: 'Cửa hàng bán lẻ',
  },
];
