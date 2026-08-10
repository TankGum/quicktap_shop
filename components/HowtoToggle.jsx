'use client';

// Nút gạt Trước/Sau cho mục "Cách hoạt động" — bấm để đổi nội dung tại chỗ thay vì hiện
// cả 2 song song. Mặc định mở "Sau" (cách dùng QuickTap): dẫn khách bằng sự đơn giản trước,
// "Trước" chỉ để đối chiếu khi họ tò mò. Theo đúng khuôn FaqAccordion.jsx đã có trong site
// (button aria-expanded/aria-selected + panel dùng `hidden`, không unmount/mount qua lại).

import { useState } from 'react';

const TABS = [
  { id: 'truoc', label: 'Trước' },
  { id: 'sau', label: 'Sau' },
];

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
        hidden={active !== 'truoc'}
      >
        <p className="howto-toggle-flow">
          Mở app <span aria-hidden="true">→</span> Tìm tên quán <span aria-hidden="true">→</span> Chọn chi
          nhánh <span aria-hidden="true">→</span> Cuộn tìm nút <span aria-hidden="true">→</span> Viết
        </p>
      </div>

      <div
        id="howto-panel-sau"
        role="tabpanel"
        aria-labelledby="howto-tab-sau"
        hidden={active !== 'sau'}
      >
        <p className="howto-toggle-flow howto-toggle-flow-accent">
          Chạm <span aria-hidden="true">→</span> Viết
        </p>
      </div>
    </div>
  );
}
