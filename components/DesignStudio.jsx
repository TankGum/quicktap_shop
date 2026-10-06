'use client';

// Công cụ tự lên mẫu ở trang /thiet-ke-rieng: khách chọn sản phẩm, tải logo, chọn màu nền +
// màu chữ, xem mẫu ngay trên màn hình rồi gửi kèm thông tin liên hệ.
//
// Toàn bộ phần vẽ nằm ở lib/designPreview.js, hình học nằm ở data/designTemplates.js —
// component này chỉ lo tương tác và gửi đơn.
//
// Đơn gửi tới /api/thiet-ke-rieng (Cloudflare Pages Function, xem functions/api/), rồi từ đó
// mới vào D1 + Cloudinary. KHÔNG ghi thẳng kho dữ liệu từ đây: làm vậy thì khoá bí mật phải
// nằm trong JS của trình duyệt, ai mở DevTools cũng dùng được.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { designTemplates, bgPresets } from '@/data/designTemplates';
import {
  drawDesign, renderToBlob, loadImageFile, loadMockup,
  slotFrameFor, imageDeltaToUnit, inspectLogo, relativeLuminance, logoBoxInSlot, slotClipPath,
  DEFAULT_VIEW, MIN_ZOOM, MAX_ZOOM, MIN_LOGO_EDGE, MIN_BG_LUMINANCE,
} from '@/lib/designPreview';
import { siteConfig } from '@/lib/siteConfig';
// Luật kiểm tra dùng chung với Pages Function nhận đơn — xem lib/orderValidation.js.
import { validateOrder, LIMITS } from '@/lib/orderValidation';
import { CheckIcon, WarningIcon, PhoneIcon, CloseIcon } from './icons';
import Standee3D from './Standee3D';

// Logo gốc được gửi NGUYÊN BẢN, không nén lại: file này dùng để lên bản in thật, hạ chất
// lượng ở đây là hỏng việc. Chỉ chặn trên để một cú tải nhầm ảnh RAW không làm nghẽn endpoint.
const MAX_LOGO_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

const EMPTY_FORM = { shop: '', phone: '', quantity: '1', note: '' };

// Dòng lỗi dưới một ô nhập. role="alert" để trình đọc màn hình đọc lên ngay khi nó xuất hiện
// (lỗi chỉ hiện lúc bấm gửi, tức là ngay sau một hành động của khách — không phải tự nhiên la
// lên giữa lúc họ đang gõ).
function FieldError({ id, message }) {
  if (!message) return null;
  return <p className="studio-input-error" id={id} role="alert">{message}</p>;
}

export default function DesignStudio() {
  const [templateId, setTemplateId] = useState(designTemplates[0].id);
  const [logo, setLogo] = useState(null); // { image, url, file, info }
  // Ảnh chụp sản phẩm, KÈM src của chính nó: { src, img }. Phải mang theo src vì lúc đổi mẫu
  // có một nhịp mà `template` đã là mẫu mới trong khi state này vẫn giữ ảnh của mẫu cũ —
  // ghép nhầm hai thứ đó lại chính là con bug "ảnh bị bóp méo khi chuyển tab" (xem mockupImg).
  const [mockup, setMockup] = useState(null);
  // null = giữ nguyên nền trắng của ảnh gốc. Chỉ có tác dụng với mẫu in mực đen trên nền
  // trắng (mẫu nào có `face` trong data/designTemplates.js).
  const [bgColor, setBgColor] = useState(null);
  // Khách tự chỉnh vị trí + cỡ logo trong ô chừa. dx/dy tính theo hệ đơn vị của ô (0..1) chứ
  // không theo pixel: nhờ vậy đổi mẫu hay đổi kích thước cửa sổ thì logo vẫn nằm đúng chỗ
  // tương đối mà khách đã chọn.
  const [view, setView] = useState(DEFAULT_VIEW);
  const [logoError, setLogoError] = useState(null);

  // Đang rê file qua vùng studio -> hiện lớp phủ "thả vào đây".
  const [dropActive, setDropActive] = useState(false);
  // dragleave bắn cả khi con trỏ đi từ phần tử con này sang phần tử con khác bên trong cùng
  // một vùng. Đếm vào/ra để chỉ tắt lớp phủ khi thật sự rời hẳn ra ngoài, nếu không nó nhấp
  // nháy liên tục lúc rê qua các ô bên trong.
  const dragDepth = useRef(0);

  const [form, setForm] = useState(EMPTY_FORM);
  // Lỗi theo từng ô, khoá trùng tên ô trong `form`. Chỉ hiện SAU khi khách bấm gửi: bắt lỗi
  // ngay lúc đang gõ dở là mắng người ta giữa chừng câu.
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState({ state: 'idle' }); // idle | sending | done | error

  // Mô hình 3D thay cho ảnh chụp: mặt in phẳng của mẫu (template.flat) ghép logo + màu nền
  // thành một ảnh, bọc lên khối 3D. `stageMode`: 'rotate' = kéo để xoay, 'edit' = kéo để dời logo.
  const [stageMode, setStageMode] = useState('rotate');
  const [flatMock, setFlatMock] = useState(null);
  const [texture, setTexture] = useState(null);
  const [fontTick, setFontTick] = useState(0);
  const composeRef = useRef(null);
  const fileInputRef = useRef(null);
  // Số pixel của ẢNH MẶT IN PHẲNG trên mỗi pixel CSS của mặt trước mô hình 3D — dùng để quy
  // quãng kéo trên màn hình về quãng dịch trên ảnh. Standee3D cập nhật qua onFaceWidth.
  const imgPerCssRef = useRef(1);
  // Các ngón/chuột đang chạm mô hình, để phân biệt kéo (1 điểm) với chụm phóng to (2 điểm).
  const pointersRef = useRef(new Map());
  const pinchRef = useRef(null);
  // Font thật của trang, đọc từ DOM chứ không chép tay lại danh sách font: sửa --font trong
  // globals.css mà quên sửa ở đây thì preview lại vẽ bằng font khác hẳn trang.
  const fontRef = useRef('sans-serif');

  const template = useMemo(
    () => designTemplates.find((t) => t.id === templateId) || designTemplates[0],
    [templateId]
  );

  // Mẫu không đổi màu được thì bỏ qua lựa chọn màu, nhưng VẪN GIỮ giá trị trong state để
  // khách quay lại mẫu đổi được thì màu cũ còn nguyên.
  // CHỐT CHẶN của con bug nói trên: hàm vẽ chạy TRƯỚC hàm nạp ảnh (effect vẽ khai báo trước
  // effect nạp), nên có đúng một nhịp `template` là mẫu mới còn `mockup` vẫn là ảnh mẫu cũ.
  // Vẽ nhịp đó ra thì ảnh cũ bị kéo méo theo tỉ lệ của mẫu mới — và tệ hơn, tintMockup() nhớ
  // luôn kết quả sai vào cache nên ảnh hỏng vĩnh viễn. Không tô màu thì không có cache nên
  // tự khỏi, vì vậy trước đây lỗi chỉ lộ ra sau khi khách chọn màu nền.
  const mockupImg = mockup?.src === template.image ? mockup.img : null;

  const canTint = Boolean(template.face);
  const activeBg = canTint ? bgColor : null;
  const bgTooDark = Boolean(activeBg) && relativeLuminance(activeBg) < MIN_BG_LUMINANCE;

  // ----- Vẽ lại preview mỗi khi có gì đó đổi -----
  // Mặt in phẳng của mẫu đang chọn. id riêng (":flat") vì bộ tô màu cache theo template.id —
  // dùng chung id với ảnh chụp thì lấy nhầm mặt nạ của ảnh kia.
  const flat = template.flat;
  const flatTpl = useMemo(() => ({ ...flat, id: `${template.id}:flat` }), [flat, template.id]);
  const flatImg = flatMock?.src === flat.image ? flatMock.img : null;

  useEffect(() => {
    let cancelled = false;
    loadMockup(flat.image).then((img) => {
      if (!cancelled) setFlatMock({ src: flat.image, img });
    });
    return () => { cancelled = true; };
  }, [flat.image]);

  // Font của trang (SN Pro) tải xong thì vẽ lại: dòng chữ "Logo của bạn" trong ô trống vẽ lên
  // canvas, vẽ trước khi font về là ra font dự phòng.
  useEffect(() => {
    fontRef.current = getComputedStyle(document.body).fontFamily || 'sans-serif';
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (cancelled) return;
      fontRef.current = getComputedStyle(document.body).fontFamily || 'sans-serif';
      setFontTick((t) => t + 1);
    });
    return () => { cancelled = true; };
  }, []);

  // Ảnh NỀN mặt in: mẫu phẳng + màu nền (+ khung nét đứt "Logo của bạn" khi chưa có logo).
  // KHÔNG chứa logo — logo là lớp riêng chồng lên (faceOverlay bên dưới), nên kéo / phóng logo
  // không phải dựng lại ảnh này. Trước đây logo vẽ thẳng vào đây: mỗi khung hình kéo là một lần
  // vẽ + nén JPEG ~900×1267 rồi trình duyệt giải mã lại — đo được ~240ms mỗi lần, kéo giật hẳn.
  // Giờ ảnh này chỉ dựng lại khi đổi mẫu / màu / có-hay-chưa logo. toBlob (nén ngoài luồng
  // chính) + object URL thay cho toDataURL (nén đồng bộ, chuỗi base64 to).
  const hasLogo = Boolean(logo?.image);
  useEffect(() => {
    if (!flatImg) return undefined;
    let cancelled = false;
    const raf = requestAnimationFrame(() => {
      const c = composeRef.current || (composeRef.current = document.createElement('canvas'));
      c.width = flatTpl.size.w;
      c.height = flatTpl.size.h;
      drawDesign(c.getContext('2d'), {
        template: flatTpl,
        mockup: flatImg,
        bgColor: activeBg,
        tintWidth: flatTpl.size.w,
        logo: null,
        placeholder: !hasLogo,
        fontFamily: fontRef.current,
      });
      c.toBlob((blob) => {
        if (cancelled || !blob) return;
        const url = URL.createObjectURL(blob);
        setTexture((prev) => {
          if (prev) setTimeout(() => URL.revokeObjectURL(prev), 1000);
          return url;
        });
      }, 'image/jpeg', 0.9);
    });
    return () => { cancelled = true; cancelAnimationFrame(raf); };
  }, [flatTpl, flatImg, activeBg, hasLogo, fontTick]);

  // Rời trang thì trả bộ nhớ của ảnh nền cuối cùng (các bản cũ hơn đã trả lúc thay ảnh).
  const textureRef = useRef(null);
  textureRef.current = texture;
  useEffect(() => () => { if (textureRef.current) URL.revokeObjectURL(textureRef.current); }, []);

  // Lớp logo chồng lên mặt in: một thẻ <img> đặt bằng % theo đúng phép tính của bộ vẽ
  // (logoBoxInSlot), cắt theo hình ô chừa bằng clip-path.
  const logoBox = hasLogo
    ? logoBoxInSlot(flat.slot, logo.image.naturalWidth || logo.image.width, logo.image.naturalHeight || logo.image.height, view)
    : null;
  const pct = (v, total) => `${((v / total) * 100).toFixed(3)}%`;
  const faceOverlay = logoBox ? (
    <span className="std3d-overlay" style={{ clipPath: slotClipPath(flat.slot, flat.size) }}>
      <img
        src={logo.url}
        alt=""
        draggable={false}
        style={{
          left: pct(logoBox.x, flat.size.w),
          top: pct(logoBox.y, flat.size.h),
          width: pct(logoBox.w, flat.size.w),
          height: pct(logoBox.h, flat.size.h),
        }}
      />
    </span>
  ) : null;

  // Standee in hai mặt cùng một mẫu; bảng vuông chỉ có mặt trước.
  const model3d = useMemo(() => (texture ? [{
    id: `studio-${template.id}`,
    type: flat.type,
    front: texture,
    back: texture,
    base: flat.base,
  }] : null), [texture, template.id, flat.type, flat.base]);

  useEffect(() => {
    let cancelled = false;
    setMockup(null);
    loadMockup(template.image).then((img) => {
      if (!cancelled) setMockup({ src: template.image, img });
    });
    return () => { cancelled = true; };
  }, [template]);

  // Đổi mẫu hay đổi logo thì trả về mặc định: ô chừa của mỗi mẫu có hình dạng khác hẳn nhau,
  // giữ lại quãng dịch cũ sẽ ném logo ra một góc chẳng ai chọn.
  useEffect(() => { setView(DEFAULT_VIEW); }, [template, logo]);

  // Một chỗ duy nhất thu hồi object URL của logo: cleanup này chạy với giá trị `logo` của lần
  // render trước mỗi khi logo đổi, và chạy lần cuối lúc rời trang. Revoke thêm ở chỗ chọn
  // file/xoá file là thừa, mà lại dễ thành hai nơi cùng quản một vòng đời.
  useEffect(() => () => { if (logo?.url) URL.revokeObjectURL(logo.url); }, [logo]);

  // Thả trượt ra ngoài vùng nhận thì trình duyệt MỞ luôn file đó, cuốn khách rời khỏi trang
  // và mất sạch phần vừa chỉnh. Chặn mặc định trên cả trang trong lúc công cụ đang mở.
  useEffect(() => {
    const stop = (e) => e.preventDefault();
    window.addEventListener('dragover', stop);
    window.addEventListener('drop', stop);
    return () => {
      window.removeEventListener('dragover', stop);
      window.removeEventListener('drop', stop);
    };
  }, []);

  // ----- Nhận file thả vào -----
  // Chỉ phản ứng với FILE. Bôi đen chữ rồi rê đi cũng sinh sự kiện kéo — không lọc thì lớp phủ
  // "thả logo vào đây" bật lên giữa lúc khách chỉ đang chọn chữ trong ô ghi chú.
  const isFileDrag = (e) => Array.from(e.dataTransfer?.types || []).includes('Files');

  function onDragEnter(e) {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    dragDepth.current += 1;
    setDropActive(true);
  }

  function onDragOver(e) {
    // Bắt buộc phải chặn mặc định ở dragover, nếu không sự kiện drop sẽ không bao giờ bắn.
    if (isFileDrag(e)) e.preventDefault();
  }

  function onDragLeave(e) {
    if (!isFileDrag(e)) return;
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setDropActive(false);
    }
  }

  function onDrop(e) {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    dragDepth.current = 0;
    setDropActive(false);
    // Thả nhiều file (hoặc cả thư mục) thì lấy file đầu; sai định dạng đã có onPickLogo báo lại.
    onPickLogo(e.dataTransfer.files?.[0]);
  }

  // ----- Kéo / phóng to logo trong ô chừa -----
  const clampZoom = (z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
  const canAdjust = Boolean(logo?.image);

  // Quy quãng kéo trên màn hình (px CSS) về quãng dịch trong hệ đơn vị của ô chừa. Phải đi qua
  // slotFrameFor vì ô chừa là hình bình hành nghiêng theo mặt sản phẩm — kéo ngang trên màn
  // hình không bằng "đi ngang" trên mặt bảng.
  const panBy = useCallback((dxCss, dyCss) => {
    const img = logo?.image;
    if (!img) return;
    // Quãng kéo trên màn hình quy về pixel của MẶT IN PHẲNG (imgPerCssRef do Standee3D báo
    // qua onFaceWidth), rồi về đơn vị của ô logo. `view` tính theo tỉ lệ ô nên dùng chung được
    // cho cả mặt in 3D lẫn ảnh chụp gửi kèm đơn.
    const frame = slotFrameFor(flat.slot, (img.naturalWidth || 1) / (img.naturalHeight || 1));
    const k = imgPerCssRef.current;
    const { du, dv } = imageDeltaToUnit(frame, dxCss * k, dyCss * k);
    setView((v) => ({ ...v, dx: v.dx + du, dy: v.dy + dv }));
  }, [logo, flat]);

  function onPointerDown(e) {
    if (!canAdjust) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    // Ngón thứ hai chạm vào -> chuyển sang chế độ chụm, ghi lại khoảng cách khởi điểm.
    if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      pinchRef.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), scale: view.scale };
    }
  }

  function onPointerMove(e) {
    const pts = pointersRef.current;
    if (!canAdjust || !pts.has(e.pointerId)) return;
    const prev = pts.get(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pts.size === 2 && pinchRef.current) {
      const [a, b] = [...pts.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchRef.current.dist > 0) {
        const next = clampZoom(pinchRef.current.scale * (dist / pinchRef.current.dist));
        setView((v) => ({ ...v, scale: next }));
      }
      return;
    }
    panBy(e.clientX - prev.x, e.clientY - prev.y);
  }

  function onPointerUp(e) {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
  }

  function onWheel(e) {
    if (!canAdjust) return;
    setView((v) => ({ ...v, scale: clampZoom(v.scale * (e.deltaY > 0 ? 0.94 : 1.06)) }));
  }

  // ----- Chọn logo -----
  async function onPickLogo(file) {
    if (!file) return;
    setLogoError(null);

    if (!ACCEPTED.includes(file.type)) {
      setLogoError('Định dạng nhận được: PNG, JPG, WebP hoặc SVG.');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError(`File nặng ${(file.size / 1024 / 1024).toFixed(1)}MB, vượt mức 10MB. Bạn gửi bản nhẹ hơn giúp mình nhé.`);
      return;
    }

    const { image, url, error } = await loadImageFile(file);
    if (error) {
      setLogoError(error);
      return;
    }
    const info = inspectLogo(image);
    // Màu đang dùng có phải do MÁY tự lấy từ logo cũ không (khác với màu khách tự chọn tay).
    const prevAuto = logo?.info?.tint;
    setLogo({ image, url, file, info });
    // Có logo thì chuyển ngay sang chế độ chỉnh: mô hình quay về chính diện, logo nằm thẳng
    // trước mặt để khách kéo / phóng cho vừa.
    setStageMode('edit');

    // Tự lấy màu nền theo tông chủ đạo của logo mới.
    if (info.tint) setBgColor(info.tint);
    // Logo mới không có màu nào đáng kể (logo đen trắng): trả nền về trắng NẾU màu đang dùng
    // là màu máy tự lấy từ logo trước — giữ lại thì khách nhìn thấy màu của một cái logo
    // không còn ở đó nữa. Còn màu do khách tự chọn thì tuyệt đối không đụng vào.
    else if (bgColor && bgColor === prevAuto) setBgColor(null);
  }

  function clearLogo() {
    setLogo(null);
    setStageMode('rotate');
    setLogoError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // Gõ lại vào ô đang báo lỗi thì xoá lỗi của RIÊNG ô đó. Không kiểm tra lại ngay từng phím:
  // đang gõ dở "091" mà bị báo "số chưa đúng" thì chỉ gây bực; lỗi sẽ tính lại lúc bấm gửi.
  function updateField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
    setFieldErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  }

  // ----- Gửi đơn -----
  async function onSubmit(e) {
    e.preventDefault();
    if (status.state === 'sending') return;

    // Kiểm tra TRƯỚC khi dựng ảnh: dựng canvas ra PNG mất cả giây trên máy yếu, sai số điện
    // thoại mà vẫn bắt khách chờ chừng đó rồi mới báo lỗi là vô duyên.
    const check = validateOrder(form);
    if (!check.ok) {
      setFieldErrors(check.errors);
      // Đưa con trỏ về ô sai đầu tiên: trên điện thoại ô đó có thể đang nằm ngoài màn hình,
      // không tự cuộn tới thì khách chỉ thấy nút bấm mà không có gì xảy ra.
      const firstInvalid = ['shop', 'phone', 'quantity', 'note'].find((k) => check.errors[k]);
      document.getElementById(`studio-${firstInvalid}`)?.focus();
      return;
    }
    setFieldErrors({});

    setStatus({ state: 'sending' });

    try {
      const preview = await renderToBlob({
        template,
        mockup: mockupImg,
        bgColor: activeBg,
        logo: logo?.image || null,
        view,
        fontFamily: fontRef.current,
      });

      // Gửi bản ĐÃ chuẩn hoá (số điện thoại về dạng 0912345678, chữ đã gộp khoảng trắng) chứ
      // không phải chuỗi thô trong ô nhập.
      const body = new FormData();
      body.append('shop', check.value.shop);
      body.append('phone', check.value.phone);
      body.append('quantity', String(check.value.quantity));
      body.append('note', check.value.note);
      // Chỉ gửi ảnh mẫu đã dựng xong. File logo gốc KHÔNG gửi: bảng đơn không có chỗ chứa
      // nó, mà logo có thể nặng tới 10MB — bắt khách tải lên một thứ rồi vứt đi là vô lý.
      if (preview) body.append('preview', preview, `mau-${template.id}.png`);

      const res = await fetch('/api/thiet-ke-rieng', { method: 'POST', body });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || 'Gửi không thành công.');
      }
      setStatus({ state: 'done', code: data.code });
    } catch (err) {
      setStatus({
        state: 'error',
        message: `${err.message} Bạn gọi thẳng ${siteConfig.phoneDisplay} giúp mình nhé — mẫu vừa chỉnh vẫn còn nguyên trên màn hình.`,
      });
    }
  }

  // Dựng một lần rồi đặt vào HAI chỗ: dưới ảnh (điện thoại) và trong bước 2 (máy tính).
  // Trên điện thoại mọi thứ xếp dọc, để thanh trượt ở tận bước 2 thì lúc kéo nó khách không
  // còn nhìn thấy cái ảnh mình đang chỉnh. Chỗ nào không dùng thì CSS ẩn hẳn (display:none)
  // nên trình đọc màn hình cũng chỉ thấy một bộ điều khiển, không bị lặp.
  const adjustControls = canAdjust ? (
    <div className="studio-adjust">
      <label className="studio-zoom">
        <span>Cỡ logo</span>
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step="0.01"
          value={view.scale}
          onChange={(e) => setView((v) => ({ ...v, scale: Number(e.target.value) }))}
        />
      </label>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => setView(DEFAULT_VIEW)}
        disabled={view.dx === 0 && view.dy === 0 && view.scale === 1}
      >
        Đặt lại
      </button>
    </div>
  ) : null;

  // ----- Đã gửi xong -----
  if (status.state === 'done') {
    return (
      <div className="studio-done">
        <span className="studio-done-mark" aria-hidden="true"><CheckIcon /></span>
        <h3>Đã nhận mẫu của bạn</h3>
        <p>
          {status.code ? <>Mã đơn <strong>{status.code}</strong>. </> : null}
          Chúng tôi xem mẫu rồi gọi lại trong vòng 2 phút để chốt bản in.
        </p>
        <div className="studio-done-actions">
          <a className="btn btn-primary" href={siteConfig.phoneHref}>
            <PhoneIcon className="i" />
            Gọi luôn {siteConfig.phoneDisplay}
          </a>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => { setStatus({ state: 'idle' }); setForm(EMPTY_FORM); setFieldErrors({}); }}
          >
            Gửi thêm mẫu khác
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="studio"
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Lớp phủ lúc đang gửi. Dựng ảnh mẫu (canvas -> PNG) rồi upload mất vài giây trên máy
          yếu hoặc mạng 3G, mà mỗi chữ "Đang gửi…" trên nút thì không đủ: nút nằm cuối form,
          trên điện thoại nó thường đã trôi khỏi tầm nhìn lúc khách ngẩng lên chờ.
          Phủ kín cũng là cố ý chặn thao tác — ảnh đã dựng xong TRƯỚC khi gửi, nên khách chỉnh
          tiếp lúc này chỉ tạo cảm giác sai là bản chỉnh đó có trong đơn. */}
      {status.state === 'sending' && (
        <div className="studio-sending" role="status" aria-live="polite">
          <div className="studio-sending-card">
            {/* Dùng lại .route-spinner của phần chuyển trang: cùng một ý "đang chờ" thì nên
                nhìn giống nhau, và nó đã có sẵn luật prefers-reduced-motion. */}
            <span className="route-spinner" aria-hidden="true" />
            <p className="studio-sending-title">Đang gửi mẫu của bạn…</p>
            <p className="studio-sending-note">Ảnh mẫu đang được tải lên, chờ mình vài giây nhé.</p>
          </div>
        </div>
      )}

      {/* Cả vùng công cụ đều nhận file, không phải mỗi cái nút nhỏ: người ta rê file tới đâu
          thả tới đó, bắt nhắm trúng một ô bé chỉ tổ trượt tay. pointer-events:none để lớp phủ
          không cướp mất sự kiện drop của vùng bên dưới. */}
      {dropActive && (
        <div className="studio-drop" aria-hidden="true">
          <span>Thả file logo vào đây</span>
        </div>
      )}
      {/* ----- Cột trái: mẫu đang xem ----- */}
      <div className="studio-stage">
        {/* Tỉ lệ mẫu đưa xuống CSS để nó chặn bề rộng sao cho CHIỀU CAO luôn vừa màn hình:
            standee A6 cao gần gấp rưỡi bảng vuông, chặn theo bề rộng như nhau thì mẫu standee
            dài quá tầm nhìn, mà cột này lại dính theo màn hình khi cuộn. */}
        {/* Mô hình 3D của chính sản phẩm, mặt in là logo + màu khách chọn (thay cho ảnh chụp
            phẳng trước đây). Hai chế độ: xoay xem mọi phía, hoặc chỉnh logo — chỉ hiện khi đã có
            logo. Ảnh gửi kèm đơn vẫn dựng trên ảnh chụp sản phẩm (renderToBlob), không đổi. */}
        {canAdjust && (
          <div className="studio-mode" role="group" aria-label="Chế độ xem mẫu">
            <button
              type="button"
              className={stageMode === 'edit' ? 'is-on' : ''}
              aria-pressed={stageMode === 'edit'}
              onClick={() => setStageMode('edit')}
            >
              Chỉnh logo
            </button>
            <button
              type="button"
              className={stageMode === 'rotate' ? 'is-on' : ''}
              aria-pressed={stageMode === 'rotate'}
              onClick={() => setStageMode('rotate')}
            >
              Xoay 3D
            </button>
          </div>
        )}
        <div className={`studio-3d${model3d ? '' : ' is-loading'}`}>
          {model3d && (
            <Standee3D
              key={flat.type}
              models={model3d}
              faceOverlay={faceOverlay}
              editor={{
                active: canAdjust && stageMode === 'edit',
                onPointerDown,
                onPointerMove,
                onPointerUp,
                onWheel,
                onFaceWidth: (px) => { if (px > 0) imgPerCssRef.current = flat.size.w / px; },
              }}
            />
          )}
        </div>
        {canAdjust && (
          <p className="studio-stage-note studio-stage-tip">
            {stageMode === 'edit'
              ? 'Kéo logo để đổi vị trí, chụm hai ngón hoặc lăn chuột để phóng to / thu nhỏ.'
              : 'Kéo để xoay xem mọi phía. Bấm "Chỉnh logo" để quay lại chỉnh vị trí.'}
          </p>
        )}

        {/* Trên điện thoại thanh chỉnh cỡ nằm NGAY DƯỚI ảnh để vừa kéo vừa nhìn được kết quả.
            Trên máy tính nó ẩn đi vì đã có bản trong bước 2 — xem chú thích ở adjustControls. */}
        <div className="studio-adjust-at studio-adjust-mobile">{adjustControls}</div>

        <p className="studio-stage-note">
          Ảnh chỉ để bạn dễ hình dung bố cục. Bản in thật sẽ do chúng tôi thiết kế và trao đổi
          lại với bạn cho tới khi ưng ý mới in.
        </p>
      </div>

      {/* ----- Cột phải: điều khiển ----- */}
      {/* noValidate: tắt bong bóng "Please fill out this field" của trình duyệt để chỉ còn MỘT
          kiểu báo lỗi (dòng chữ dưới ô, tiếng Việt, cùng luật với server). Thuộc tính
          `required` vẫn giữ vì trình đọc màn hình dựa vào nó để đọc "bắt buộc". */}
      <form className="studio-panel" onSubmit={onSubmit} noValidate>
        <fieldset className="studio-field">
          <legend>1. Chọn sản phẩm</legend>
          {/* Nhìn như thanh tab nhưng bên trong vẫn là nhóm radio thật: giữ được điều hướng
              bằng phím mũi tên và trình đọc màn hình vẫn đọc đúng "chọn 1 trong 3". Đổi sang
              <button> cho giống tab hơn thì mất cả hai thứ đó. */}
          <div className="studio-tabs">
            {designTemplates.map((t) => (
              <label key={t.id} className={`studio-tab${t.id === templateId ? ' is-on' : ''}`}>
                <input
                  type="radio"
                  name="template"
                  value={t.id}
                  checked={t.id === templateId}
                  onChange={() => setTemplateId(t.id)}
                />
                <b>{t.tabTitle}</b>
                <span>{t.tabSub}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="studio-field">
          <legend>2. Logo của bạn</legend>
          <input
            ref={fileInputRef}
            id="studio-logo"
            className="studio-file"
            type="file"
            accept={ACCEPTED.join(',')}
            onChange={(e) => onPickLogo(e.target.files?.[0])}
          />
          <div className="studio-file-row">
            <label className="btn btn-ghost btn-sm studio-file-btn" htmlFor="studio-logo">
              {logo ? 'Chọn file khác' : 'Tải logo lên'}
            </label>
            {/* Ẩn trên máy cảm ứng: ở đó không có thao tác kéo thả file, nhắc chỉ gây rối. */}
            <span className="studio-file-drophint">hoặc kéo thả file vào đây</span>
          </div>

          {logo && (
            <p className="studio-file-name">
              {logo.file.name}
              <button type="button" onClick={clearLogo} aria-label="Bỏ logo đã chọn">
                <CloseIcon />
              </button>
            </p>
          )}
          {logoError && <p className="studio-warn" role="alert"><WarningIcon /> {logoError}</p>}

          {/* Nhắc theo ĐÚNG file khách vừa chọn, không phải cảnh báo chung chung — và không
              chặn việc gửi: đây là gợi ý để bản in đẹp hơn, còn quyết định là của khách. */}
          {logo?.info?.whiteBg && (
            <p className="studio-warn" role="status">
              <WarningIcon />
              Logo này đang có nền trắng nên sẽ thành một ô trắng đè lên mẫu. Bạn gửi bản PNG
              nền trong suốt thì logo ăn liền vào nền sản phẩm.
            </p>
          )}
          {logo?.info?.tooSmall && (
            <p className="studio-warn" role="status">
              <WarningIcon />
              Ảnh chỉ {logo.info.width}×{logo.info.height}px — xem trên màn hình thì ổn nhưng in
              ra dễ bị vỡ. Bạn gửi bản cạnh dài từ {MIN_LOGO_EDGE}px trở lên giúp mình nhé.
            </p>
          )}

          <ul className="studio-specs">
            <li>Nhận <code>.png</code> <code>.jpg</code> <code>.webp</code> <code>.svg</code>, tối đa 10MB.</li>
          </ul>

          <div className="studio-adjust-at studio-adjust-desktop">{adjustControls}</div>
        </fieldset>

        {/* Chỉ hiện với mẫu in mực đen trên nền trắng. Mẫu Google xanh có màu nằm chết trong
            ảnh chụp nên không đổi được — thà giấu hẳn còn hơn để một nút bấm vào không ăn. */}
        {canTint && (
          <fieldset className="studio-field">
            <legend>3. Màu nền</legend>

            <div className="studio-swatches">
              {/* Ô lấy từ logo đứng đầu hàng và chỉ hiện khi đoán được màu — để khách đổi sang
                  màu khác rồi vẫn quay lại được màu tự động mà không phải tải lại logo. */}
              {logo?.info?.tint && (
                <button
                  type="button"
                  className={`studio-swatch${logo.info.tint === bgColor ? ' is-on' : ''}`}
                  style={{ background: logo.info.tint }}
                  onClick={() => setBgColor(logo.info.tint)}
                  title="Theo màu logo của bạn"
                >
                  <span className="sr-only">Theo màu logo của bạn</span>
                </button>
              )}
              {bgPresets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  className={`studio-swatch${p.value === bgColor ? ' is-on' : ''}${p.value ? '' : ' is-plain'}`}
                  style={p.value ? { background: p.value } : undefined}
                  onClick={() => setBgColor(p.value)}
                  title={p.label}
                >
                  <span className="sr-only">{p.label}</span>
                </button>
              ))}
            </div>

            <label className="studio-color">
              <input
                type="color"
                value={bgColor || '#ffffff'}
                onChange={(e) => setBgColor(e.target.value)}
              />
              <span>Màu khác</span>
            </label>

            {/* Cảnh báo chứ KHÔNG chặn: đây là gu của khách, mình chỉ có trách nhiệm nói trước
                rằng in ra sẽ khó dùng. Chặn hẳn thì thành cãi nhau với người trả tiền. */}
            {bgTooDark && (
              <p className="studio-warn" role="status">
                <WarningIcon />
                Nền này khá tối, mà chữ và mã QR trên mẫu đều in mực đen — in ra sẽ khó đọc và
                khách khó quét mã. Bạn cân nhắc chọn tông sáng hơn.
              </p>
            )}
            <p className="studio-hint">
              {logo?.info?.tint
                ? 'Màu nền đã lấy theo tông logo của bạn — đổi sang màu khác bất cứ lúc nào. Chữ, mã QR và logo Google in sẵn luôn giữ nguyên.'
                : 'Chỉ đổi màu nền; chữ, mã QR và logo Google in sẵn vẫn giữ nguyên.'}
            </p>
          </fieldset>
        )}

        <fieldset className="studio-field">
          <legend>{canTint ? '4' : '3'}. Thông tin để chúng tôi gọi lại</legend>

          <label className="studio-input">
            <span>Tên quán <b aria-hidden="true">*</b></span>
            <input
              id="studio-shop"
              type="text"
              required
              maxLength={LIMITS.shop}
              autoComplete="organization"
              value={form.shop}
              onChange={(e) => updateField('shop', e.target.value)}
              aria-invalid={fieldErrors.shop ? true : undefined}
              aria-describedby={fieldErrors.shop ? 'studio-shop-error' : undefined}
            />
            <FieldError id="studio-shop-error" message={fieldErrors.shop} />
          </label>

          <div className="studio-input-row">
            <label className="studio-input">
              <span>Số điện thoại <b aria-hidden="true">*</b></span>
              <input
                id="studio-phone"
                type="tel"
                required
                inputMode="tel"
                maxLength={LIMITS.phone}
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                aria-invalid={fieldErrors.phone ? true : undefined}
                aria-describedby={fieldErrors.phone ? 'studio-phone-error' : undefined}
              />
              <FieldError id="studio-phone-error" message={fieldErrors.phone} />
            </label>
            <label className="studio-input studio-input-qty">
              <span>Số lượng <small>(từ 2 cái có giá tốt hơn)</small></span>
              <input
                id="studio-quantity"
                type="number"
                min="1"
                max={LIMITS.quantity}
                inputMode="numeric"
                value={form.quantity}
                onChange={(e) => updateField('quantity', e.target.value)}
                aria-invalid={fieldErrors.quantity ? true : undefined}
                aria-describedby={fieldErrors.quantity ? 'studio-quantity-error' : undefined}
              />
              <FieldError id="studio-quantity-error" message={fieldErrors.quantity} />
            </label>
          </div>

          <label className="studio-input">
            <span>Ghi chú</span>
            <textarea
              id="studio-note"
              rows={3}
              maxLength={LIMITS.note}
              placeholder="Link đánh giá của quán, yêu cầu riêng về mẫu…"
              value={form.note}
              onChange={(e) => updateField('note', e.target.value)}
              aria-invalid={fieldErrors.note ? true : undefined}
              aria-describedby={fieldErrors.note ? 'studio-note-error' : undefined}
            />
            <FieldError id="studio-note-error" message={fieldErrors.note} />
          </label>
        </fieldset>

        {status.state === 'error' && (
          <p className="studio-warn" role="alert"><WarningIcon /> {status.message}</p>
        )}

        <button type="submit" className="btn btn-primary btn-lg studio-submit" disabled={status.state === 'sending'}>
          {status.state === 'sending' ? 'Đang gửi…' : 'Gửi mẫu này cho chúng tôi'}
        </button>

        <p className="studio-hint studio-submit-note">
          Chưa ưng? <Link href="/lien-he">Gọi để trao đổi trực tiếp</Link> — chúng tôi lên mẫu giúp bạn.
        </p>
      </form>
    </div>
  );
}
