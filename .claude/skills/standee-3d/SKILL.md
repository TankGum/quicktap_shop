---
name: standee-3d
description: Dựng mô hình 3D tương tác (kéo xoay, xem mặt đáy) của standee chữ A liền đáy từ một file PDF thiết kế. Dùng khi người dùng đưa file PDF in standee/table tent và muốn xem thử dạng 3D, hoặc nói "tạo mô hình 3D cho file này", "dựng standee từ PDF", "làm mockup 3D standee".
---

# Standee 3D từ file PDF thiết kế

Biến một PDF in thành trang HTML tự chứa: standee chữ A liền đáy, kéo xoay được,
có bề dày giấy thật, đổ bóng, và nút lật xem mặt đáy.

**Ánh xạ trang:** trang 1 → mặt trước · trang 2 → mặt sau.

Mặt đáy là **tấm trong** dựng bằng CSS, có đường khớp chạy dọc chính giữa (chỗ hai
cánh gấp gặp nhau), và **in mực của trang 3 lên đó**: script bóc nền trắng của trang 3
rồi dò xem mực nằm thành mấy cụm — một cụm thì đặt giữa đáy, hai cụm thì mỗi cụm
một nửa, đúng chỗ hai cánh gấp. Kiểu này dùng chung cho mọi mô hình.

## Cách làm

```bash
python3 .claude/skills/standee-3d/scripts/build_standee.py "design.pdf" -o standee.html
```

Script tự đọc khổ trang từ PDF (không đoán), render 3 trang bằng ImageMagick +
Ghostscript, giảm màu rồi nhúng thành data URI — trang HTML chạy offline, không
gọi file ngoài, thường 100–170 KB.

Sau khi build **luôn phải xem lại bằng ảnh chụp** rồi mới đưa cho người dùng:

```bash
sed 's/auto=!reduce/auto=false/' standee.html > /tmp/probe.html   # tắt tự xoay để ảnh ổn định
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
  --disable-gpu --hide-scrollbars --user-data-dir=/tmp/standee-probe \
  --virtual-time-budget=2500 --window-size=1000,860 \
  --screenshot=/tmp/shot.png "file:///tmp/probe.html"
pkill -f "standee-probe"      # LUÔN kill theo marker user-data-dir, đừng pkill "Google Chrome"
```

Chrome không tự thoát (trang có vòng lặp rAF) nên bọc bằng `perl -e 'alarm 30; exec @ARGV' <lệnh>`.

Cuối cùng publish bằng tool Artifact và đưa link cho người dùng.

## Tuỳ chọn

| Cờ | Mặc định | Ý nghĩa |
|---|---|---|
| `--no-base-art` | tắt | Đáy để kính trơn, bỏ nội dung trang 3 |
| `--depth` | 47 | Chiều sâu mặt đáy (mm). Góc gấp tự suy ra để hai chân chạm đúng mép đáy |
| `--thickness` | 2 | Độ dày giấy (mm) |
| `--width-px` / `--colors` | 1050 / 32 | Độ phân giải và số màu ảnh nhúng |

## Hình học

Đáy nối liền hai chân nên chỉ có **một** thông số tự do. Chọn chiều sâu đáy `d`,
góc gấp suy ra: `góc = asin(d / 2H)` với `H` là chiều cao tấm. Cao tổng =
`H·cos(góc) + độ dày`. Đừng cho người dùng chỉnh cả hai — sẽ hở chân.

Trục camera: `rotateX` **dương là nhìn từ dưới lên**. Muốn nhìn từ trên phải dùng
số âm. Kéo chuột xuống = `rx` giảm.

Mặt đáy được đặt nhô lên `0.6mm` so với mặt phẳng chân để ăn lấn vào hai tấm,
nếu không sẽ hở một khe sáng ở chân.

## Bẫy đã gặp

- **Trang 3 là A6 dọc, đáy thì 105×47mm ngang** — đặt nguyên trang vào sẽ méo hoặc
  co bé xíu. Vì vậy mới có bước dò cụm mực rồi xếp lại. Bố cục trang 3 khác nhau
  giữa các file (có file dồn một cụm, có file tách hai), nên đừng chia đôi cứng.
- **Mặt `.f.in` của đáy bị xoay 180° trong mặt phẳng** (do `rotateY(180deg)` cộng
  với `rotateX(-90deg)` của node). Phải bù `rotate(180deg)` thì chữ mới đọc xuôi
  khi nhìn từ trên.
- Kính phải đủ đục (~55% trắng) thì mực đen mới đọc được trên nền tối.
- **`.slab > .f` có 2 class**, đè lên các rule 1 class như `.art-front`. Rule
  hoạ tiết phải viết `.f.art-front` mới thắng.
- Tên file PDF hay có dấu cách. Trong zsh phải viết `"${F}[0]"`, vì `"$F[0]"`
  bị hiểu là chỉ số mảng của zsh.
- Ảnh in là hoạ tiết phẳng ít màu → `+dither -colors 32` giảm ~90% dung lượng
  mà mắt không phân biệt được. `+dither` (tắt dither) là bắt buộc, không thì
  vùng màu phẳng bị nhiễu hạt.

## Cấu trúc

- `assets/template.html` — trang mô hình, dùng placeholder `__IMG1__`, `__PW__`,
  `__DEPTH__`, `__ANG__`… Sửa giao diện/tương tác thì sửa file này.
- `scripts/build_standee.py` — render PDF, tính hình học, điền placeholder.
