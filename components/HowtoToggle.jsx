'use client';

// Nút gạt Trước/Sau cho mục "Cách hoạt động" — bấm để đổi nội dung tại chỗ thay vì hiện
// cả 2 song song. Mặc định mở "Sau" (cách dùng QuickTap): dẫn khách bằng sự đơn giản trước,
// "Trước" chỉ để đối chiếu khi họ tò mò.
//
// Là CÔNG TẮC thật (1 nút role="switch" + núm trượt, 2 nhãn đứng 2 bên) chứ không phải
// segmented control 2 nút như bản trước — 2 nội dung này là 2 trạng thái đối nghịch của
// cùng một việc, không phải 2 mục ngang hàng để duyệt qua lại. Panel vẫn ẩn/hiện bằng
// `hidden` (không unmount/mount lại DOM), đúng khuôn FaqAccordion.jsx đã có trong site.
//
// Mỗi bước là 1 chip có màu (không phải chữ trơ nối bằng mũi tên mảnh) — bản chữ trơ ban đầu
// bị chê "xấu quá" vì thiếu hẳn chất liệu thị giác, không có gì để mắt bấu vào.

import { useState } from 'react';

const STEPS_BEFORE = ['Mở app', 'Tìm kiếm tên', 'Chọn chi nhánh', 'Cuộn tìm nút', 'Viết'];
const STEPS_AFTER = ['Chạm | Quét', 'Viết'];

function StepChips({ steps, accent }) {
  return (
    <ul className={`howto-flow-steps${accent ? ' is-accent' : ''}`}>
      {steps.map((s) => <li key={s}>{s}</li>)}
    </ul>
  );
}

export default function HowtoToggle() {
  // true = đang xem "Sau" (mặc định), false = "Trước".
  const [isAfter, setIsAfter] = useState(true);

  return (
    <div className="howto-toggle">
      <div className="howto-switch-row">
        <span className={`howto-switch-label${isAfter ? '' : ' is-on'}`} aria-hidden="true">Trước</span>
        <button
          type="button"
          role="switch"
          aria-checked={isAfter}
          aria-label="Xem quy trình sau khi dùng QuickTap (tắt để xem quy trình trước đây)"
          className="howto-switch"
          onClick={() => setIsAfter((v) => !v)}
        >
          <span className="howto-switch-thumb" />
        </button>
        <span className={`howto-switch-label${isAfter ? ' is-on' : ''}`} aria-hidden="true">Sau</span>
      </div>

      <div id="howto-panel-truoc" className="howto-toggle-panel" hidden={isAfter}>
        <StepChips steps={STEPS_BEFORE} />
      </div>

      <div id="howto-panel-sau" className="howto-toggle-panel" hidden={!isAfter}>
        <StepChips steps={STEPS_AFTER} accent />
      </div>
    </div>
  );
}
