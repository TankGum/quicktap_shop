'use client';

// Nút gạt Trước/Sau cho mục "Cách hoạt động" — bấm để đổi nội dung tại chỗ thay vì hiện
// cả 2 song song. Mặc định mở "Sau" (cách dùng QuickTap): dẫn khách bằng sự đơn giản trước,
// "Trước" chỉ để đối chiếu khi họ tò mò. Theo đúng khuôn FaqAccordion.jsx đã có trong site
// (button aria-expanded/aria-selected + panel dùng `hidden`, không unmount/mount qua lại).
//
// Mỗi bước là 1 chip có màu (không phải chữ trơ nối bằng mũi tên mảnh) — bản chữ trơ ban đầu
// bị chê "xấu quá" vì thiếu hẳn chất liệu thị giác, không có gì để mắt bấu vào.

import { useState } from 'react';

const TABS = [
  { id: 'truoc', label: 'Trước' },
  { id: 'sau', label: 'Sau' },
];

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
  const [active, setActive] = useState('sau');

  return (
    <div className="howto-toggle">
      <div className="howto-toggle-switch" role="tablist" aria-label="So sánh cách đánh giá trước và sau khi dùng QuickTap">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`howto-tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`howto-panel-${t.id}`}
            className={`howto-toggle-btn${active === t.id ? ' is-active' : ''}`}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        id="howto-panel-truoc"
        role="tabpanel"
        aria-labelledby="howto-tab-truoc"
        className="howto-toggle-panel"
        hidden={active !== 'truoc'}
      >
        <StepChips steps={STEPS_BEFORE} />
      </div>

      <div
        id="howto-panel-sau"
        role="tabpanel"
        aria-labelledby="howto-tab-sau"
        className="howto-toggle-panel"
        hidden={active !== 'sau'}
      >
        <StepChips steps={STEPS_AFTER} accent />
      </div>
    </div>
  );
}
