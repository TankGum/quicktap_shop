'use client';

// Kho giỏ hàng — sống ở localStorage, không gọi mạng.
//
// CHỈ lưu { href, qty, plan } (plan: 'buy' | 'monthly' — xem lib/cartPricing.mjs). Tuyệt đối không lưu giá hay tên: giá đổi sau mỗi lần build từ
// Airtable, mà giỏ ở localStorage thì sống lâu hơn hẳn một lần build — nhớ giá cũ là hiện số
// sai cho khách mà không ai biết. Tên và giá luôn tra lại từ /kb.json lúc hiển thị.
//
// Provider cố ý KHÔNG tải /kb.json: huy hiệu trên header chỉ cần tổng số lượng, mà bắt mọi
// trang tải thêm một file chỉ để hiện con số đó thì phí. Trang giỏ hàng tự tải lấy.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { PLANS, normalizePlan } from '@/lib/cartPricing.mjs';

const KEY = 'qt_cart_v1';
const MAX_LINES = 20;
const MAX_QTY = 999;

const CartContext = createContext(null);

// localStorage ném lỗi ở chế độ ẩn danh của một số trình duyệt và khi người dùng chặn lưu dữ
// liệu — bọc hết, giỏ hàng hỏng thì cùng lắm là quên giỏ, không được làm trắng cả trang.
function readStored() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Giỏ lưu từ trước khi có hai cách mua không có `plan` — đọc thành mua đứt, đúng thứ khách
    // đã chọn lúc đó (khi ấy chỉ có mua đứt).
    return parsed
      .filter((it) => it && typeof it.href === 'string' && Number.isInteger(it.qty) && it.qty > 0)
      .map((it) => ({ href: it.href, qty: it.qty, plan: normalizePlan(it.plan) }))
      .filter((it) => PLANS.includes(it.plan))
      .slice(0, MAX_LINES);
  } catch {
    return [];
  }
}

function writeStored(items) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* hết dung lượng hoặc bị chặn — bỏ qua, giỏ vẫn chạy trong phiên này */
  }
}

// Một dòng = một cặp (mẫu, cách mua). Cùng mẫu nhưng khác cách mua là hai dòng riêng vì giá
// khác nhau — gộp chung thì không biết bao nhiêu cái tính giá nào.
const same = (it, href, plan) => it.href === href && it.plan === normalizePlan(plan);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  // Trước khi đọc xong localStorage thì chưa biết giỏ có gì. Cần cờ này để header không nháy
  // huy hiệu "0" rồi đổi sang "3" ngay sau đó.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(readStored());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) writeStored(items);
  }, [items, ready]);

  // Giỏ mở ở hai tab thì tab kia sửa, tab này phải thấy — nếu không khách bấm đặt ở tab cũ và
  // gửi đi một giỏ đã lỗi thời.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === KEY) setItems(readStored());
    };
    addEventListener('storage', onStorage);
    return () => removeEventListener('storage', onStorage);
  }, []);

  const add = useCallback((href, qty = 1, plan = 'buy') => {
    setItems((prev) => {
      const found = prev.find((it) => same(it, href, plan));
      if (found) {
        return prev.map((it) =>
          same(it, href, plan) ? { ...it, qty: Math.min(MAX_QTY, it.qty + qty) } : it
        );
      }
      if (prev.length >= MAX_LINES) return prev;
      return [...prev, { href, qty: Math.min(MAX_QTY, Math.max(1, qty)), plan: normalizePlan(plan) }];
    });
  }, []);

  const setQty = useCallback((href, plan, qty) => {
    setItems((prev) =>
      qty < 1
        ? prev.filter((it) => !same(it, href, plan))
        : prev.map((it) => (same(it, href, plan) ? { ...it, qty: Math.min(MAX_QTY, qty) } : it))
    );
  }, []);

  const remove = useCallback((href, plan) => {
    setItems((prev) => prev.filter((it) => !same(it, href, plan)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = useMemo(() => items.reduce((n, it) => n + it.qty, 0), [items]);

  const value = useMemo(
    () => ({ items, count, ready, add, setQty, remove, clear }),
    [items, count, ready, add, setQty, remove, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart phải nằm trong <CartProvider>');
  return ctx;
}
