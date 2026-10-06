// Hình học của các mẫu trong công cụ "Thiết kế riêng" (xem components/DesignStudio.jsx).
//
// Mỗi mẫu là một ẢNH CHỤP sản phẩm thật, trên đó đã chừa sẵn một ô trống để đặt logo của
// khách. Bộ vẽ (lib/designPreview.js) không biết gì về sản phẩm — nó chỉ đọc các con số dưới
// đây, nên thêm/sửa mẫu chỉ cần động vào file này.
//
// ẢNH: dùng bản .jpg, KHÔNG dùng .png gốc. Ảnh PNG gốc mỗi file 1,5-1,8MB — nặng quá cho một
// trang landing, nhất là trên 3G. Bản JPEG chất lượng 82 chỉ còn ~200KB mỗi file mà mắt
// thường không phân biệt được vì đây là ảnh chụp. PNG gốc giữ lại trong repo để sau này cắt
// lại hoặc xuất bản khác. Xem README mục "Ảnh mẫu sản phẩm" để biết lệnh tạo lại bản JPEG.
//
// TOẠ ĐỘ tính theo pixel của chính file ảnh (xem `size`), lấy bằng cách dò pixel chứ không
// ước lượng bằng mắt. Ảnh chụp hơi nghiêng nên mặt sản phẩm là hình bình hành chứ không phải
// chữ nhật — `slot` và `face` mô tả đúng hình đó để logo/màu nằm phẳng trên mặt sản phẩm.
//
// `face` (tuỳ chọn) = vùng khách được đổi màu nền. Chỉ đặt cho mẫu in MỰC ĐEN TRÊN NỀN TRẮNG;
// mẫu đã có màu in sẵn thì màu nằm chết trong ảnh chụp, không tách ra để thay được — bỏ khoá
// `face` là mục chọn màu tự ẩn. Xem tintMockup() trong lib/designPreview.js.
// Hiện cả ba mẫu đều đổi màu được, nhưng phần kiểm tra vẫn giữ để thêm mẫu màu cố định sau
// này không phải sửa lại giao diện.

// `flat` = MẶT IN PHẲNG của cùng sản phẩm, để dựng mô hình 3D xoay được trong công cụ (xem
// components/Standee3D.jsx). Khác `image` (ảnh chụp nghiêng, có tay cầm, dùng làm ảnh gửi kèm
// đơn): đây là bản in nhìn thẳng, đã xoá sẵn ô logo. Ảnh nằm ở public/assets/studio3d:
//   - hai mẫu standee lấy từ mặt in 3D ở trang chủ (public/assets/standee3d/*-front.png), tô
//     trắng / tô xám đè lên chữ G Google để chừa ô;
//   - bảng NFC cắt từ ảnh chụp chính diện custom/temp_5.png (ô tròn vốn đã trống).
// Toạ độ `slot` / `face` tính theo pixel của chính ảnh phẳng đó, cùng quy ước với ảnh chụp.
// `type` khớp với kiểu khối trong Standee3D ('standee' = chữ A có đáy, 'card' = bảng vuông).
const flatDir = '/assets/studio3d';
const fullFace = (w, h) => ({ tl: [0, 0], tr: [w, 0], br: [w, h], bl: [0, h], radius: 0 });

export const designTemplates = [
  {
    id: 'standee-tap-scan',
    label: 'Standee A6 · mẫu Tap & Scan',
    // Nhãn trên thanh tab tách làm 2 dòng: chỉ để tên mẫu thì không biết là standee hay bảng,
    // mà ghép cả cụm vào một dòng thì tab vỡ chữ trên điện thoại.
    tabTitle: 'Standee A6',
    tabSub: 'Tap & Scan',
    // Khớp với option cột "Category" của bảng sản phẩm (xem lib/airtable.js).
    airtableName: 'Standee',
    href: '/san-pham/standee',
    image: '/assets/custom/mockup_1.jpg',
    size: { w: 1086, h: 1448 },
    // Cả nửa trên tấm thẻ để trống cho logo; khung "TAP OR SCAN" in sẵn bắt đầu ở y = 751.
    slot: {
      kind: 'quad',
      tl: [255, 265], tr: [845, 268],
      br: [848, 675], bl: [250, 672],
    },
    face: {
      tl: [192, 147], tr: [910, 147],
      br: [919, 1244], bl: [162, 1244],
      radius: 8,
    },
    flat: {
      type: 'standee',
      image: `${flatDir}/standee-tapscan.png`,
      base: '/assets/standee3d/quicktap-base.png',
      size: { w: 900, h: 1267 },
      // Cả nửa trên trống (chữ G cũ nằm ở 190–690 × 102–608), khung "TAP OR SCAN" từ y≈672.
      slot: { kind: 'quad', tl: [110, 110], tr: [790, 110], br: [790, 620], bl: [110, 620] },
      face: fullFace(900, 1267),
    },
  },
  {
    id: 'standee-google',
    label: 'Standee A6 · mẫu Google trắng',
    tabTitle: 'Standee A6',
    tabSub: 'Google trắng',
    airtableName: 'Standee',
    href: '/san-pham/standee',
    image: '/assets/custom/mockup_4.jpg',
    size: { w: 1024, h: 1536 },
    // Ô tròn xám in sẵn giữa thẻ.
    slot: { kind: 'ellipse', cx: 529, cy: 676, rx: 266, ry: 276 },
    face: {
      tl: [166, 162], tr: [862, 162],
      br: [899, 1330], bl: [193, 1330],
      radius: 8,
    },
    flat: {
      type: 'standee',
      image: `${flatDir}/standee-google.png`,
      base: '/assets/standee3d/google-base.png',
      size: { w: 900, h: 1267 },
      // Ô tròn xám, dò bằng pixel: tâm (449, 556), bán kính 296.
      slot: { kind: 'ellipse', cx: 449, cy: 556, rx: 296, ry: 296 },
      face: fullFace(900, 1267),
    },
  },
  {
    id: 'bang-nfc-trang',
    label: 'Bảng NFC 10×10 · mẫu Google trắng',
    tabTitle: 'Bảng NFC',
    tabSub: 'Google trắng',
    airtableName: 'Bảng NFC',
    href: '/san-pham/bang-nfc',
    image: '/assets/custom/mockup_5.jpg',
    size: { w: 1254, h: 1254 },
    // Ô tròn trắng nổi trên mặt bảng — sáng và lạnh hơn nền một chút.
    slot: { kind: 'ellipse', cx: 643, cy: 744, rx: 162, ry: 167 },
    face: {
      tl: [171, 123], tr: [1105, 123],
      br: [1105, 1092], bl: [171, 1092],
      // Bảng mica bo góc khá tròn; thiếu bán kính này thì màu tô lem ra 4 góc.
      radius: 48,
    },
    flat: {
      type: 'card',
      image: `${flatDir}/card-google-trang.jpg`,
      size: { w: 900, h: 900 },
      // Ô tròn trắng của temp_5.png quy về khung cắt (183–1093 × 135–1080 → 900×900).
      slot: { kind: 'ellipse', cx: 455, cy: 580, rx: 160, ry: 159 },
      // Góc bo do khối 3D lo (bảng vuông bo 8mm), tô màu cả mặt là đủ.
      face: fullFace(900, 900),
    },
  },
];

// HAI MẪU ĐÃ BỎ khỏi danh sách, file vẫn còn nguyên trong public/assets/custom/ để dùng lại:
//
//   mockup_2.jpg — chụp ĐÚNG CÙNG mẫu in với 'standee-google' ở trên, chỉ khác góc máy và nền
//   tối hơn, lại không đổi màu được. Để cả hai thì khách thấy hai lựa chọn y hệt nhau.
//     size: { w: 1086, h: 1448 }
//     slot: { kind: 'ellipse', cx: 546, cy: 698, rx: 205, ry: 205 }
//
//   mockup_3.jpg — mẫu "Google xanh". Nền xanh nằm chết trong ảnh chụp nên KHÔNG đổi màu được;
//   đứng cạnh ba mẫu đổi màu thoải mái thì nó thành lựa chọn cụt.
//     size: { w: 1254, h: 1254 }
//     slot: { kind: 'ellipse', cx: 638, cy: 719, rx: 189, ry: 195 }
//     (không có `face`)
//
// Thêm lại = chép khối tương ứng vào mảng trên kèm label/tabTitle/tabSub/airtableName/href.

// Bảng màu nền gợi ý. CỐ TÌNH chỉ có tông sáng, vì hai lý do đều là chuyện in ấn thật:
//   - mã QR và chữ trên mẫu đều in mực đen; nền tối thì QR không quét được và chữ khó đọc;
//   - logo Google và ngôi sao vàng in sẵn trên mẫu sẽ bị lệch màu nếu nền quá đậm.
// Khách vẫn tự chọn được màu bất kỳ ở ô bên cạnh, chỉ là sẽ có cảnh báo khi màu quá tối.
export const bgPresets = [
  { label: 'Trắng nguyên bản', value: null },
  { label: 'Kem', value: '#f6efe3' },
  { label: 'Hồng phấn', value: '#fbe8e6' },
  { label: 'Xanh mint', value: '#e4f2ea' },
  { label: 'Xanh biển', value: '#e6eefb' },
  { label: 'Vàng nắng', value: '#fdf2d5' },
  { label: 'Xám khói', value: '#eceef0' },
  { label: 'Nâu sữa', value: '#f0e5d9' },
];
