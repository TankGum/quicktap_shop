# Video quảng cáo trang chủ (Remotion)

Video motion graphic 20 giây, 30fps, không tiếng, hai bản:

| Composition | Kích thước  | File render                        | Ô Airtable (bảng media trang chủ) |
|-------------|-------------|------------------------------------|-----------------------------------|
| `Desktop`   | 1920×1080   | `out/quicktap-promo-desktop.mp4`   | `heroVideo`                       |
| `Mobile`    | 1080×1920   | `out/quicktap-promo-mobile.mp4`    | `heroVideoMobile`                 |

Trang chủ chiếu nó ở section "VIDEO SẢN PHẨM" (`#video-san-pham`): màn rộng từ 640px nhận
bản ngang, màn hẹp hơn nhận bản dọc (xem `components/HeroVideo.jsx`).

Ảnh sản phẩm lấy thẳng từ `../public/assets/standee3d/` (xem `remotion.config.js`), và hình khối
3D là bản chép của mô hình ở hero (`components/Standee3D.jsx` + khối `.std3d-*` trong
`app/globals.css`) — sửa hình học ở bên đó thì chép sang `src/models.css` cho khớp.

## Cảnh

Cùng một bộ cảnh cho cả hai bản; mỗi cảnh khai bố cục `landscape`/`portrait` ở đầu file.

| Giây     | File                          | Nội dung                                                        |
|----------|-------------------------------|-----------------------------------------------------------------|
| 0–7      | `src/scenes/TapDemo.jsx`      | Standee xoay vào, zoom tới "TAP YOUR PHONE", điện thoại chạm → popup NFC → trang đánh giá → 5 sao → Đăng |
| 7–12.5   | `src/scenes/CardCarousel.jsx` | 4 mẫu bảng NFC, mỗi mẫu một ý: NFC · QR · chống nước · in logo  |
| 12.5–16  | `src/scenes/Platforms.jsx`    | Standee Google / TripAdvisor / Booking + các nền tảng khác      |
| 16–20    | `src/scenes/Finale.jsx`       | Dàn sản phẩm + khẩu hiệu + thương hiệu, rồi trả standee về tư thế mở màn |

Khung cuối trùng khung đầu (standee Google ở tư thế `OPENING` trong `src/layout.js`), nên video
lặp trên trang không có vết cắt, và khung đầu — thứ hiện khi video chưa chạy hoặc khách bật
"giảm chuyển động" — là sản phẩm chứ không phải nền trống. Đổi thời lượng hay tư thế mở màn thì
giữ nguyên ràng buộc này.

Điện thoại trong video (`src/Phone.jsx`) dựng bằng CSS; quán "Sương Mai Coffee" trên màn hình là
quán giả định.

## Chạy

Cần Node 22 (shell mặc định của máy là Node 18):

```bash
export PATH=~/.local/share/quicktap-node22/bin:$PATH
cd video
npm install
npm run studio          # xem trước, tua từng khung trong trình duyệt
npm run render          # render cả hai bản vào out/
```

Render một khung để soát nhanh: `npx remotion still src/index.js Mobile out/f.png --frame=150`.

## Đưa lên site

Upload file vào bảng media trang chủ trên Airtable: `out/quicktap-promo-desktop.mp4` vào dòng
`heroVideo`, `out/quicktap-promo-mobile.mp4` vào dòng `heroVideoMobile` (chưa có thì thêm dòng
mới, cột Key ghi `heroVideoMobile`). Lần build sau site tự lấy về và đẩy lên Cloudinary.
