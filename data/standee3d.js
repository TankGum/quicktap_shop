// Các mẫu standee dựng 3D ở trang chủ (xem components/Standee3D.jsx).
//
// Ảnh ba mặt nằm ở /public/assets/standee3d, sinh ra từ chính file PDF in bằng
// `python3 scripts/standee-assets.py` — thêm mẫu mới thì bỏ PDF vào thư mục gốc,
// khai báo trong MODELS của script đó, chạy lại, rồi thêm một mục vào đây.
//
// `front`/`back` là hoạ tiết in hai mặt tấm A6. `base` là mực của trang 3 đã bóc
// nền trắng, in lên mặt đáy trong suốt.

const dir = '/assets/standee3d';

export const standeeModels = [
  {
    id: 'google',
    name: 'Google Maps',
    note: 'Mẫu bán chạy nhất',
    front: `${dir}/google-front.png`,
    back: `${dir}/google-back.png`,
    base: `${dir}/google-base.png`,
  },
  {
    id: 'tripadvisor',
    name: 'TripAdvisor',
    note: 'Cho khách nước ngoài',
    front: `${dir}/tripadvisor-front.png`,
    back: `${dir}/tripadvisor-back.png`,
    base: `${dir}/tripadvisor-base.png`,
  },
  {
    id: 'booking',
    name: 'Booking.com',
    note: 'Khách sạn, homestay',
    front: `${dir}/booking-front.png`,
    back: `${dir}/booking-back.png`,
    base: `${dir}/booking-base.png`,
  },
  {
    id: 'quicktap',
    name: 'Đa nền tảng',
    note: 'Chạm hoặc quét QR',
    front: `${dir}/quicktap-front.png`,
    back: `${dir}/quicktap-back.png`,
    base: `${dir}/quicktap-base.png`,
  },
];
