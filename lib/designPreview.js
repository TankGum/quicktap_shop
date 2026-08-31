// Ghép logo của khách vào ảnh chụp sản phẩm. CHỈ CHẠY TRONG TRÌNH DUYỆT (khác lib/airtable.js
// vốn là server-only) — cần <canvas> và Image.
//
// Một hàm vẽ duy nhất dùng cho CẢ HAI việc: preview khách nhìn trên màn hình, và ảnh PNG đính
// kèm đơn gửi về. Tách làm hai bộ vẽ thì sớm muộn cũng lệch nhau, mà khi lệch thì thứ khách
// bấm duyệt lại không phải thứ bạn nhận được — đúng cái sai đắt nhất ở đây.
//
// Không biết gì về sản phẩm: toàn bộ hình học đọc từ data/designTemplates.js.

// '#rgb' | '#rrggbb' -> [r, g, b] 0..255. Trả null nếu chuỗi không hợp lệ.
export function parseHex(hex) {
  const s = String(hex || '').trim().replace(/^#/, '');
  const full = s.length === 3 ? s.replace(/./g, (c) => c + c) : s;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}

// Độ sáng tương đối (WCAG) của một mã màu: 0 = đen, 1 = trắng.
export function relativeLuminance(hex) {
  const rgb = parseHex(hex);
  if (!rgb) return 1;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Dưới mức này thì mực đen in trên nền đó khó đọc và mã QR khó quét.
export const MIN_BG_LUMINANCE = 0.55;

// ---------- Đổi màu nền mặt sản phẩm ----------

// Vẽ đường bao mặt sản phẩm, có bo góc. Dùng arcTo chứ không phải roundRect vì mặt sản phẩm
// là hình bình hành (ảnh chụp hơi nghiêng) — roundRect chỉ nhận hình chữ nhật thẳng.
function traceFace(ctx, face, k = 1) {
  const p = [face.tl, face.tr, face.br, face.bl].map(([x, y]) => [x * k, y * k]);
  const r = (face.radius || 0) * k;
  ctx.beginPath();
  ctx.moveTo((p[0][0] + p[1][0]) / 2, (p[0][1] + p[1][1]) / 2);
  for (let i = 0; i < 4; i++) {
    const cur = p[(i + 1) % 4];
    const next = p[(i + 2) % 4];
    ctx.arcTo(cur[0], cur[1], (cur[0] + next[0]) / 2, (cur[1] + next[1]) / 2, r);
  }
  ctx.closePath();
}

// Mặt nạ nói pixel nào nằm TRONG mặt sản phẩm. Ngoài vùng đó tuyệt đối không đụng tới, nếu
// không mặt bàn đá và hậu cảnh sáng màu cũng bị nhuộm theo. Dựng một lần cho mỗi (mẫu, bề rộng).
const maskCache = new Map();

function getFaceMask(template, w, h) {
  const key = `${template.id}|${w}`;
  const hit = maskCache.get(key);
  if (hit) return hit;

  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#fff';
  traceFace(ctx, template.face, w / template.size.w);
  ctx.fill();

  const src = ctx.getImageData(0, 0, w, h).data;
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < mask.length; i++) mask[i] = src[i * 4 + 3];

  maskCache.set(key, mask);
  return mask;
}

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

// Nhớ kết quả theo (mẫu, màu, bề rộng): kéo qua lại giữa các màu hay đổi mẫu rồi quay lại đều
// lấy ngay bản cũ. Giới hạn số bản nhớ để không phình bộ nhớ khi khách nghịch ô chọn màu.
const tintCache = new Map();
const TINT_CACHE_MAX = 16;

/**
 * Tô lại nền mặt sản phẩm sang màu khách chọn.
 *
 * KHÔNG dùng chế độ hoà trộn 'multiply' phủ cả mặt: cách đó nhuộm luôn logo Google 4 màu và
 * ngôi sao vàng in sẵn — nền càng đậm thì hai thứ đó càng hỏng. Thay vào đó xét TỪNG PIXEL và
 * chỉ đổi những pixel vừa SÁNG vừa TRUNG TÍNH, tức phần giấy trắng:
 *   - mực in đen             -> tối, trọng số 0, giữ nguyên;
 *   - logo Google, sao vàng  -> bão hoà cao, trọng số 0, giữ nguyên;
 *   - giấy trắng, xám nhạt   -> trọng số 1, đổi sang màu mới.
 *
 * Màu mới được nhân với độ sáng gốc của từng pixel nên bóng đổ, vệt sáng và nếp gợn của ảnh
 * chụp còn nguyên — đó là thứ giữ cho ảnh vẫn ra ảnh chụp chứ không thành mảng màu phẳng.
 */
export function tintMockup(template, mockup, color, targetW) {
  if (!template.face || !color || !mockup) return mockup;

  const w = Math.max(1, Math.round(targetW));
  const h = Math.max(1, Math.round((w * template.size.h) / template.size.w));
  // Khoá nhớ có cả NGUỒN ẢNH, không chỉ id mẫu: nếu vì lý do nào đó ảnh truyền vào không phải
  // ảnh của mẫu này, kết quả sai sẽ nằm ở một khoá khác chứ không đè lên khoá đúng. Đây là
  // lớp chặn thứ hai cho con bug đổi tab — lớp thứ nhất nằm ở mockupImg trong DesignStudio.
  const key = `${template.id}|${mockup.src || template.image}|${color}|${w}`;
  const hit = tintCache.get(key);
  if (hit) return hit;

  const rgb = parseHex(color);
  if (!rgb) return mockup;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(mockup, 0, 0, w, h);

  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const mask = getFaceMask(template, w, h);

  // Mức sáng của phần giấy trắng, đo trên CHÍNH ảnh này thay vì lấy hằng số: mỗi ảnh chụp một
  // kiểu phơi sáng, dùng hằng số thì ảnh sáng bị tô nhạt màu còn ảnh tối bị đậm quá.
  let sum = 0;
  let count = 0;
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) continue;
    const p = i * 4;
    const mx = Math.max(d[p], d[p + 1], d[p + 2]);
    const mn = Math.min(d[p], d[p + 1], d[p + 2]);
    if (mx > 200 && mx - mn < 18) { sum += mx; count++; }
  }
  const refLum = count ? sum / count : 235;

  for (let i = 0; i < mask.length; i++) {
    const m = mask[i];
    if (!m) continue;
    const p = i * 4;
    const r = d[p];
    const g = d[p + 1];
    const b = d[p + 2];

    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    const sat = mx ? (mx - mn) / mx : 0;
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    // Trung tính tới đâu (sat <= 0.10 là hoàn toàn, >= 0.22 thì thôi) và sáng tới đâu.
    const weight = clamp01((0.22 - sat) / 0.12) * clamp01((lum - 120) / 60) * (m / 255);
    if (weight <= 0) continue;

    const k = lum / refLum;
    d[p] = r + (Math.min(255, rgb[0] * k) - r) * weight;
    d[p + 1] = g + (Math.min(255, rgb[1] * k) - g) * weight;
    d[p + 2] = b + (Math.min(255, rgb[2] * k) - b) * weight;
  }

  ctx.putImageData(img, 0, 0);

  if (tintCache.size >= TINT_CACHE_MAX) tintCache.delete(tintCache.keys().next().value);
  tintCache.set(key, canvas);
  return canvas;
}

// ---------- Đặt logo vào ô chừa sẵn ----------

// Trạng thái "khách chưa chỉnh gì": logo canh giữa ô, cỡ vừa khít.
export const DEFAULT_VIEW = { dx: 0, dy: 0, scale: 1 };
// Chặn hai đầu thanh phóng to: dưới 0.3 thì logo bé như hạt bụi, trên 2.5 thì phần lớn logo
// nằm ngoài ô và bị cắt sạch — cả hai đều chỉ làm khách tưởng công cụ hỏng.
export const MIN_ZOOM = 0.3;
export const MAX_ZOOM = 2.5;

/**
 * Hình chữ nhật LỚN NHẤT có tỉ lệ `ratio` (rộng/cao) nhét vừa trong một hình elip.
 *
 * Không dùng hình vuông nội tiếp cho mọi logo: logo chữ nằm ngang (kiểu "CAFE 88", tỉ lệ 3:1)
 * nhét vào hình vuông nội tiếp thì bé tí, chừa hai khoảng trống to hai bên trong khi vẫn còn
 * cả bề ngang hình tròn để dùng.
 *
 * Góc (a, b) nằm trên elip: (a/rx)² + (b/ry)² = 1, với a = ratio·b.
 */
function largestRectInEllipse(rx, ry, ratio) {
  const b = 1 / Math.sqrt((ratio * ratio) / (rx * rx) + 1 / (ry * ry));
  return { halfW: ratio * b, halfH: b };
}

/**
 * Quy mọi loại ô chừa về cùng một dạng: gốc toạ độ + vector cạnh ngang (u) + vector cạnh dọc
 * (v). Nhờ vậy phần vẽ chỉ cần biết một khuôn duy nhất, dù ô là hình bình hành (mặt sản phẩm
 * chụp nghiêng) hay hình elip (ô tròn in sẵn, chụp nghiêng thành elip).
 *
 * @param ratio tỉ lệ rộng/cao của logo — ô elip co theo tỉ lệ này, ô hình bình hành thì không.
 */
function slotFrame(slot, ratio) {
  if (slot.kind === 'ellipse') {
    // Chừa 6% cho logo thở, nếu không 4 góc logo chạm sát viền hình tròn.
    const { halfW, halfH } = largestRectInEllipse(slot.rx * 0.94, slot.ry * 0.94, ratio);
    return {
      ox: slot.cx - halfW,
      oy: slot.cy - halfH,
      ux: halfW * 2, uy: 0,
      vx: 0, vy: halfH * 2,
    };
  }
  // Hình bình hành: lấy 3 đỉnh là đủ. Đỉnh thứ 4 (br) chỉ lệch vài pixel so với tl+u+v vì ảnh
  // chụp gần như chính diện — sai số đó nhỏ hơn nhiều so với lề an toàn quanh ô.
  return {
    ox: slot.tl[0], oy: slot.tl[1],
    ux: slot.tr[0] - slot.tl[0], uy: slot.tr[1] - slot.tl[1],
    vx: slot.bl[0] - slot.tl[0], vy: slot.bl[1] - slot.tl[1],
  };
}

// Chuyển một quãng kéo tính bằng PIXEL ẢNH sang hệ đơn vị của ô chừa (0..1 theo hai cạnh).
// Cần nghịch đảo ma trận cạnh vì ô chừa là hình bình hành: kéo ngang trên màn hình không
// tương ứng đúng với "sang phải" theo cạnh ngang của mặt sản phẩm đang nghiêng.
export function imageDeltaToUnit(frame, dxImg, dyImg) {
  const det = frame.ux * frame.vy - frame.vx * frame.uy;
  if (!det) return { du: 0, dv: 0 };
  return {
    du: (frame.vy * dxImg - frame.vx * dyImg) / det,
    dv: (-frame.uy * dxImg + frame.ux * dyImg) / det,
  };
}

export function slotFrameFor(slot, ratio) {
  return slotFrame(slot, ratio);
}

// Giới hạn ô chừa thành đường cắt: khách kéo/phóng thoải mái nhưng logo không bao giờ tràn ra
// phần hoạ tiết đã in sẵn. Cắt chứ không chặn thao tác — bị cắt là phản hồi thật thà rằng
// "chỗ này không chứa hết logo", còn chặn tay khách thì họ không hiểu vì sao kéo không đi.
function clipToSlot(ctx, slot) {
  ctx.beginPath();
  if (slot.kind === 'ellipse') {
    ctx.ellipse(slot.cx, slot.cy, slot.rx, slot.ry, 0, 0, Math.PI * 2);
  } else {
    ctx.moveTo(...slot.tl);
    ctx.lineTo(...slot.tr);
    ctx.lineTo(...slot.br);
    ctx.lineTo(...slot.bl);
    ctx.closePath();
  }
  ctx.clip();
}

/**
 * Vẽ logo nằm phẳng trên mặt sản phẩm.
 *
 * Ánh xạ ô vuông đơn vị (0..1) lên hình bình hành của ô chừa, nên logo nghiêng đúng theo mặt
 * sản phẩm trong ảnh thay vì dán đè lên như một miếng sticker phẳng.
 *
 * @param view { dx, dy, scale } — khách tự chỉnh: dời (theo hệ đơn vị của ô) và phóng to/thu nhỏ.
 */
function drawLogoInSlot(ctx, logo, slot, view) {
  const lw = logo.naturalWidth || logo.width;
  const lh = logo.naturalHeight || logo.height;
  if (!lw || !lh) return;

  const f = slotFrame(slot, lw / lh);
  const uLen = Math.hypot(f.ux, f.uy);
  const vLen = Math.hypot(f.vx, f.vy);

  // Cỡ mặc định: thu vừa ô, GIỮ NGUYÊN tỉ lệ. Logo khách gửi lên đủ mọi tỉ lệ — kéo cho đầy ô
  // là méo logo của người ta, lỗi không thể chấp nhận với một công cụ in ấn.
  const fit = Math.min(uLen / lw, vLen / lh);
  const w = ((lw * fit) / uLen) * view.scale; // quy về hệ đơn vị 0..1
  const h = ((lh * fit) / vLen) * view.scale;

  ctx.save();
  clipToSlot(ctx, slot);
  // transform (nhân dồn) chứ KHÔNG phải setTransform (thay thế): canvas preview đang mang sẵn
  // tỉ lệ hiển thị (ảnh 1086px vẽ trên khung rộng ~600px). setTransform xoá mất tỉ lệ đó, khiến
  // logo trên màn hình bị vẽ to bằng cỡ ảnh gốc trong khi ảnh xuất kèm đơn lại đúng — nghĩa là
  // thứ khách bấm duyệt khác thứ mình nhận được.
  ctx.transform(f.ux, f.uy, f.vx, f.vy, f.ox, f.oy);
  ctx.drawImage(logo, (1 - w) / 2 + view.dx, (1 - h) / 2 + view.dy, w, h);
  ctx.restore();
}

// Chưa có logo thì vẽ nét đứt đúng hình ô chừa — khách thấy ngay logo sẽ nằm đâu, to cỡ nào.
function drawEmptySlot(ctx, slot, size, fontFamily) {
  ctx.save();
  ctx.strokeStyle = '#8a8a90';
  ctx.lineWidth = Math.max(2, size.w * 0.004);
  ctx.setLineDash([size.w * 0.018, size.w * 0.016]);

  let cx;
  let cy;
  if (slot.kind === 'ellipse') {
    ctx.beginPath();
    ctx.ellipse(slot.cx, slot.cy, slot.rx * 0.94, slot.ry * 0.94, 0, 0, Math.PI * 2);
    ctx.stroke();
    cx = slot.cx;
    cy = slot.cy;
  } else {
    ctx.beginPath();
    ctx.moveTo(...slot.tl);
    ctx.lineTo(...slot.tr);
    ctx.lineTo(...slot.br);
    ctx.lineTo(...slot.bl);
    ctx.closePath();
    ctx.stroke();
    cx = (slot.tl[0] + slot.tr[0] + slot.br[0] + slot.bl[0]) / 4;
    cy = (slot.tl[1] + slot.tr[1] + slot.br[1] + slot.bl[1]) / 4;
  }

  ctx.setLineDash([]);
  ctx.fillStyle = '#6e6e73';
  ctx.font = `500 ${size.w * 0.034}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Logo của bạn', cx, cy);
  ctx.restore();
}

/**
 * @param ctx       CanvasRenderingContext2D đã scale về hệ toạ độ pixel của ảnh mẫu
 * @param template  một phần tử của designTemplates
 * @param mockup    HTMLImageElement ảnh chụp sản phẩm, đã tải xong (null = chưa tải)
 * @param logo      HTMLImageElement logo khách, đã tải xong, hoặc null
 * @param fontFamily font đang dùng trên trang, để chữ giữ chỗ khớp với phần còn lại của site
 */
export function drawDesign(ctx, { template, mockup, bgColor, tintWidth, logo, view = DEFAULT_VIEW, fontFamily }) {
  const { size, slot } = template;
  ctx.clearRect(0, 0, size.w, size.h);

  // Tô màu ở ĐÚNG số pixel sẽ hiển thị (tintWidth), không phải ở độ phân giải ảnh gốc: preview
  // chỉ rộng chừng 600px nên tính trên ~0,5 triệu pixel là đủ và đủ nhanh để kéo thanh màu
  // không giật. Lúc xuất ảnh kèm đơn thì truyền bề rộng gốc để có bản đầy đủ.
  const art = bgColor ? tintMockup(template, mockup, bgColor, tintWidth || size.w) : mockup;
  if (art) ctx.drawImage(art, 0, 0, size.w, size.h);

  if (logo) drawLogoInSlot(ctx, logo, slot, view);
  else drawEmptySlot(ctx, slot, size, fontFamily);
}



/**
 * Dựng canvas ngoài màn hình rồi vẽ mẫu ở đúng độ phân giải ảnh gốc để đính kèm đơn.
 * Ảnh này là thứ khách đã bấm duyệt, nên nó phải ra từ CÙNG hàm drawDesign ở trên.
 */
export function renderToBlob({ template, mockup, bgColor, logo, view, fontFamily }) {
  const canvas = document.createElement('canvas');
  canvas.width = template.size.w;
  canvas.height = template.size.h;

  const ctx = canvas.getContext('2d');
  // Nền trắng: PNG trong suốt mở bằng trình xem ảnh nền tối sẽ nhìn sai màu.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawDesign(ctx, { template, mockup, bgColor, tintWidth: template.size.w, logo, view, fontFamily });

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

// ---------- Tải ảnh ----------

const mockupCache = new Map();

// Ảnh mẫu chỉ tải khi khách chọn tới, và tải một lần rồi nhớ luôn: 3 ảnh chụp cộng lại vẫn là
// vài trăm KB, tải sẵn cả ba ngay khi mở trang là bắt người chỉ xem một mẫu phải trả tiền
// mạng cho hai mẫu kia.
export function loadMockup(src) {
  if (mockupCache.has(src)) return mockupCache.get(src);
  const p = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
  mockupCache.set(src, p);
  return p;
}

// ---------- Đoán màu nền từ logo ----------

function rgbToHsl(r, g, b) {
  const R = r / 255, G = g / 255, B = b / 255;
  const mx = Math.max(R, G, B), mn = Math.min(R, G, B);
  const l = (mx + mn) / 2;
  if (mx === mn) return { h: 0, s: 0, l };
  const d = mx - mn;
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h;
  if (mx === R) h = ((G - B) / d + (G < B ? 6 : 0)) / 6;
  else if (mx === G) h = ((B - R) / d + 2) / 6;
  else h = ((R - G) / d + 4) / 6;
  return { h: h * 360, s, l };
}

function hslToHex(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const seg = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][Math.floor(h / 60) % 6];
  return '#' + seg.map((v) => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('');
}

// Nền pha ra luôn nằm ở vùng RẤT SÁNG. Không lấy thẳng màu logo làm nền được: logo xanh navy
// hay đỏ đô sẽ cho ra nền tối, mà chữ và mã QR trên mẫu đều in mực đen — in ra là không đọc
// được, quét cũng không ra. Nên chỉ mượn TÔNG MÀU (hue) của logo, còn độ sáng thì ép về mức
// của bộ màu gợi ý sẵn có (xem bgPresets trong data/designTemplates.js).
const TINT_LIGHTNESS = 0.93;
const TINT_SAT = { min: 0.28, max: 0.6 };

/**
 * Tìm tông màu chủ đạo của logo rồi pha thành một sắc nền nhạt.
 *
 * Bỏ qua pixel trong suốt, pixel gần trắng/gần đen và pixel xám: logo thường là chữ đen cộng
 * một màu thương hiệu — thứ cần tìm là cái màu đó, không phải đám mực đen chiếm nhiều diện
 * tích hơn.
 *
 * Gom theo TỪNG KHOẢNG HUE rồi chọn khoảng nặng nhất, thay vì lấy trung bình toàn ảnh: logo
 * hai màu (vd đỏ + xanh) mà lấy trung bình sẽ ra một màu xám vô nghĩa không có trong logo.
 *
 * @returns mã màu hex, hoặc null nếu logo không có màu nào đáng kể (logo đen trắng).
 */
function dominantTint(ctx, size) {
  const d = ctx.getImageData(0, 0, size, size).data;
  const BUCKETS = 18; // mỗi khoảng 20 độ
  const weight = new Float64Array(BUCKETS);
  // Cộng theo vector đơn vị để tính trung bình hue trong khoảng — cộng thẳng số đo góc sẽ sai
  // ở chỗ giáp ranh 360/0 (màu đỏ nằm cả hai đầu thang đo).
  const sumX = new Float64Array(BUCKETS);
  const sumY = new Float64Array(BUCKETS);
  const sumS = new Float64Array(BUCKETS);

  for (let i = 0; i < size * size; i++) {
    const p = i * 4;
    if (d[p + 3] < 200) continue;
    const { h, s, l } = rgbToHsl(d[p], d[p + 1], d[p + 2]);
    if (s < 0.18 || l > 0.93 || l < 0.1) continue;

    const b = Math.floor(h / (360 / BUCKETS)) % BUCKETS;
    // Màu càng đậm càng "ra chất thương hiệu" -> tính trọng số theo độ bão hoà.
    const w = s;
    weight[b] += w;
    sumX[b] += Math.cos((h * Math.PI) / 180) * w;
    sumY[b] += Math.sin((h * Math.PI) / 180) * w;
    sumS[b] += s * w;
  }

  let best = -1;
  let bestW = 0;
  for (let b = 0; b < BUCKETS; b++) if (weight[b] > bestW) { bestW = weight[b]; best = b; }

  // Ngưỡng tối thiểu: vài pixel màu lạc lõng (viền răng cưa, vệt nén JPEG) không đủ để coi là
  // màu thương hiệu. 1.5% số pixel là mức đủ để bỏ qua nhiễu mà vẫn bắt được logo màu nhỏ.
  if (best < 0 || bestW < size * size * 0.015) return null;

  let hue = (Math.atan2(sumY[best], sumX[best]) * 180) / Math.PI;
  if (hue < 0) hue += 360;
  const sat = Math.min(TINT_SAT.max, Math.max(TINT_SAT.min, (sumS[best] / weight[best]) * 0.9));
  return hslToHex(hue, sat, TINT_LIGHTNESS);
}

// Cạnh dài tối thiểu để in không bị vỡ. Ô chừa logo chiếm khoảng 1/3 chiều rộng sản phẩm;
// in ở 300dpi thì phần đó cần cỡ 400-500px, lấy 600 để còn dư khi khách phóng logo to lên.
export const MIN_LOGO_EDGE = 600;

/**
 * Soi nhanh file logo để nhắc khách hai lỗi hay gặp nhất, KHÔNG chặn việc gửi.
 *
 *  - nền trắng: logo tách từ file Word/ảnh chụp thường kèm nền trắng đặc, dán lên mẫu sẽ
 *    thành một ô trắng vuông đè lên hoạ tiết — nhìn là biết ngay nhưng khách hay không để ý;
 *  - ảnh quá nhỏ: xem trên màn hình vẫn ổn nhưng in ra thì vỡ.
 *
 * Đoán "nền trắng" bằng 4 góc ảnh: cả 4 đều đục và gần trắng thì gần như chắc chắn là ảnh
 * nền trắng chứ không phải PNG trong suốt. Logo hình vuông có nền màu thật sự cũng lọt vào
 * đây — nên đây chỉ là lời nhắc, không phải lỗi.
 */
export function inspectLogo(img) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const tooSmall = Math.max(w, h) < MIN_LOGO_EDGE;

  // 64 thay vì 48: cùng một lượt vẽ này còn dùng để đếm màu chủ đạo, mẫu thưa quá thì logo
  // có chi tiết màu nhỏ dễ bị bỏ sót.
  const N = 64;
  const canvas = document.createElement('canvas');
  canvas.width = N;
  canvas.height = N;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, N, N);

  let whiteBg = false;
  let tint = null;
  try {
    tint = dominantTint(ctx, N);
    const d = ctx.getImageData(0, 0, N, N).data;
    const at = (x, y) => {
      const i = (y * N + x) * 4;
      return { r: d[i], g: d[i + 1], b: d[i + 2], a: d[i + 3] };
    };
    const corners = [at(1, 1), at(N - 2, 1), at(1, N - 2), at(N - 2, N - 2)];
    whiteBg = corners.every((c) => c.a > 240 && c.r > 235 && c.g > 235 && c.b > 235);
  } catch {
    // getImageData có thể ném lỗi nếu canvas bị "nhiễm bẩn" (ảnh khác nguồn). File do khách
    // tự chọn thì không rơi vào trường hợp đó, nhưng thà bỏ qua lời nhắc còn hơn vỡ giao diện.
  }

  return { width: w, height: h, tooSmall, whiteBg, tint };
}

/**
 * Đọc file khách chọn thành <img> đã sẵn sàng để vẽ.
 * Trả về { image, url, error } — SVG thiếu kích thước nội tại, file hỏng, hoặc file không
 * phải ảnh đều rơi vào `error` để giao diện báo lại bằng tiếng người.
 */
export function loadImageFile(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (!img.naturalWidth || !img.naturalHeight) {
        URL.revokeObjectURL(url);
        resolve({ image: null, error: 'File SVG này không khai báo kích thước nên không hiện được. Bạn gửi bản PNG giúp mình nhé.' });
        return;
      }
      // KHÔNG revoke ở đây: <img> vẫn cần URL đó để vẽ lại mỗi lần đổi mẫu.
      resolve({ image: img, url, error: null });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ image: null, error: 'Không đọc được file này. Định dạng nhận được: PNG, JPG, WebP hoặc SVG.' });
    };
    img.src = url;
  });
}
