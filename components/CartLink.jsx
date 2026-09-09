'use client';

// Link giỏ hàng trên header — LUÔN hiện, kể cả khi giỏ trống.
//
// Biểu tượng giỏ đứng sẵn ở đó là một lời mời và một đường quay lại /gio-hang; con số chỉ nhô
// lên khi thật sự có hàng.

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/components/CartStore';

export default function CartLink() {
  const { count, ready } = useCart();

  return (
    <Link
      className="cart-link"
      href="/gio-hang"
      aria-label={count > 0 ? `Giỏ hàng, ${count} sản phẩm` : 'Giỏ hàng, đang trống'}
    >
      <ShoppingCart className="i" aria-hidden="true" />
      {/* `ready` chặn nháy: trước khi đọc xong localStorage thì count luôn là 0, render ngay sẽ
          thấy huy hiệu hiện lên rồi biến mất trong vài chục mili giây. */}
      {ready && count > 0 && <span className="cart-link-count">{count}</span>}
    </Link>
  );
}
