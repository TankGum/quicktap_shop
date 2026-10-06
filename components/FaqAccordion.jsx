'use client';

import { useState } from 'react';

export default function FaqAccordion({ items }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="faq-list">
      {items.map((item, i) => {
        const open = i === openIndex;
        return (
          <div className={`faq-item${open ? ' is-open' : ''}`} key={item.q}>
            <h3>
              <button
                type="button"
                className="faq-trigger"
                aria-expanded={open}
                aria-controls={`faq-panel-${i}`}
                onClick={() => setOpenIndex(open ? -1 : i)}
              >
                <span>{item.q}</span>
                {/* Dấu "+" trong ô tròn, mở ra thì xoay thành "×" — vẽ bằng CSS (.faq-plus). */}
                <span className="faq-plus" aria-hidden="true" />
              </button>
            </h3>
            <div className="faq-panel" id={`faq-panel-${i}`} role="region" hidden={!open}>
              <p>{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
