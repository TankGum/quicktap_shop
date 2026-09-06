// Các mẫu sản phẩm dựng 3D ở trang chủ (xem components/Standee3D.jsx).
//
// `type` quyết định hình khối:
//   'standee' — hai tấm A6 gấp chữ A, có tấm đáy trong nối hai chân (3 mặt in)
//   'card'    — bảng vuông 100×100mm bo góc 8mm, dày 2mm (chỉ mặt trước, sau trắng trơn)
//
// Ảnh ba mặt nằm ở /public/assets/standee3d, sinh ra từ chính file PDF in bằng
// `python3 scripts/standee-assets.py` — thêm mẫu mới thì bỏ PDF vào thư mục gốc,
// khai báo trong MODELS của script đó, chạy lại, rồi thêm một mục vào đây.
//
// Với standee: `front`/`back` là hoạ tiết hai mặt tấm A6, `base` là mực của trang 3 đã
// bóc nền trắng để in lên mặt đáy trong suốt.
// Với bảng vuông: chỉ có `front`.

const dir = '/assets/standee3d';

export const standeeModels = [
  {
    id: 'google',
    type: 'standee',
    name: 'Google Maps',
    note: 'Mẫu bán chạy nhất',
    front: `${dir}/google-front.png`,
    back: `${dir}/google-back.png`,
    base: `${dir}/google-base.png`,
  },
  {
    id: 'tripadvisor',
    type: 'standee',
    name: 'TripAdvisor',
    note: 'Cho khách nước ngoài',
    front: `${dir}/tripadvisor-front.png`,
    back: `${dir}/tripadvisor-back.png`,
    base: `${dir}/tripadvisor-base.png`,
  },
  {
    id: 'booking',
    type: 'standee',
    name: 'Booking.com',
    note: 'Khách sạn, homestay',
    front: `${dir}/booking-front.png`,
    back: `${dir}/booking-back.png`,
    base: `${dir}/booking-base.png`,
  },
  {
    id: 'quicktap',
    type: 'standee',
    name: 'Đa nền tảng',
    note: 'Chạm hoặc quét QR',
    front: `${dir}/quicktap-front.png`,
    back: `${dir}/quicktap-back.png`,
    base: `${dir}/quicktap-base.png`,
  },
  {
    id: 'card-google-nau',
    type: 'card',
    name: 'Bảng Google · Nâu',
    note: 'Hợp quán gỗ, cà phê',
    front: `${dir}/card-google-nau.png`,
  },
  {
    id: 'card-google-xanh-la',
    type: 'card',
    name: 'Bảng Google · Xanh lá',
    note: 'Hợp quán ăn, trà sữa',
    front: `${dir}/card-google-xanh-la.png`,
  },
  {
    id: 'card-google-xanh-duong',
    type: 'card',
    name: 'Bảng Google · Xanh dương',
    note: 'Hợp spa, cửa hàng',
    front: `${dir}/card-google-xanh-duong.png`,
  },
  {
    id: 'card-tripadvisor',
    type: 'card',
    name: 'Bảng TripAdvisor',
    note: 'Cho khách nước ngoài',
    front: `${dir}/card-tripadvisor.png`,
  },
];
