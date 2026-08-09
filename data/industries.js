// Ảnh minh hoạ từng loại hình phù hợp, cho mục "Phù hợp với" ở trang chủ.
//
// Đang dùng ảnh miễn phí bản quyền từ Unsplash (Unsplash License — dùng thương mại
// thoải mái, không cần ghi nguồn) làm ảnh tạm, vì chưa có ảnh chụp quán/cơ sở thật.
//
// ====================== THAY ẢNH THẬT KHI CÓ ======================
// Có ảnh chụp thật (quán/khách sạn/tiệm của khách hàng, hoặc ảnh đại diện đúng loại
// hình bạn tự chọn): upload lên Cloudinary → copy "Secure URL" → dán vào `image`.
// Để `image: null` thì mục đó tự dùng icon minh hoạ thay vì để trống ô.
// ====================================================================

export const industries = [
  {
    id: 'hotel',
    label: 'Khách sạn',
    image: 'https://images.unsplash.com/photo-1759038086403-c607d67bb245?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'homestay',
    label: 'Homestay',
    image: 'https://images.unsplash.com/photo-1752407828784-67a92663c866?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'restaurant',
    label: 'Nhà hàng',
    image: 'https://images.unsplash.com/photo-1753727471014-efe38840c7c7?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'cafe',
    label: 'Quán cà phê',
    image: 'https://images.unsplash.com/photo-1756637318624-7c681a13f811?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'spa',
    label: 'Spa & làm đẹp',
    image: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'shop',
    label: 'Cửa hàng bán lẻ',
    image: 'https://images.unsplash.com/photo-1756641964889-5a04b6e0f4f6?auto=format&fit=crop&w=800&q=80',
  },
];
