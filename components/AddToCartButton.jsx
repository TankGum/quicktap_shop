'use client';

// Nút mua trên trang chi tiết mẫu: "Thêm vào giỏ" và "Mua ngay".
//
// Hai nút vì hai ý định khác nhau. Khách mua nhiều mẫu thì thêm vào giỏ rồi xem tiếp; khách
// chỉ cần đúng mẫu này thì đi thẳng sang thanh toán, không phải bấm thêm một bước nữa.
//
// Ba trạng thái không mua được (hết hàng / chưa niêm yết giá) quyết định bằng CHÍNH luật mà
// server dùng (lib/cartPricing.mjs) chứ không đoán lại: /api/dat-hang sẽ từ chối chúng, nên để
// nút bấm được rồi mới báo lỗi ở bước cuối là bắt khách đi hết một quãng đường cụt.

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/CartStore';
import { isOutOfStock, parsePrice } from '@/lib/cartPricing.mjs';
import { siteConfig } from '@/lib/siteConfig';
import { ShoppingCart } from 'lucide-react';

export default function AddToCartButton({ variant }) {
  const { add } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (isOutOfStock(variant.name)) {
    return (
      <p className="cart-add-off">
        Mẫu này đang hết hàng. Bạn xem mẫu khác cùng loại, hoặc gọi{' '}
        <a href={siteConfig.phoneHref}>{siteConfig.phoneDisplay}</a> để hỏi lịch về hàng.
      </p>
    );
  }

  if (parsePrice(variant.price) === null) {
    return (
      <p className="cart-add-off">
        Mẫu này chưa niêm yết giá. Gọi <a href={siteConfig.phoneHref}>{siteConfig.phoneDisplay}</a>{' '}
        hoặc nhắn Zalo để được báo giá.
      </p>
    );
  }

  return (
    <div className="cart-add">
      <div className="cart-add-row">
        <div className="cart-add-stepper">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Bớt một cái">−</button>
          <label className="sr-only" htmlFor="cart-qty">Số lượng</label>
          <input
            id="cart-qty"
            type="number"
            min="1"
            max="999"
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(999, Number(e.target.value) || 1)))}
          />
          <button type="button" onClick={() => setQty((q) => Math.min(999, q + 1))} aria-label="Thêm một cái">+</button>
        </div>

        <button
          type="button"
          className="btn btn-outline cart-add-main"
          onClick={() => {
            add(variant.href, qty);
            setAdded(true);
          }}
        >
          <ShoppingCart className="i" aria-hidden="true" />
          Thêm vào giỏ
        </button>

        {/* Mua ngay = thêm vào giỏ rồi đi thẳng sang thanh toán. Vẫn đi qua giỏ chứ không có
            đường tắt riêng: một luồng đặt hàng duy nhất thì chỉ có một chỗ để sai. */}
        <button
          type="button"
          className="btn btn-primary cart-add-main"
          onClick={() => {
            add(variant.href, qty);
            router.push('/gio-hang');
          }}
        >
          Mua ngay
        </button>
      </div>

      {/* Không tự chuyển trang khi bấm "Thêm vào giỏ": khách hay đặt nhiều mẫu, đá họ ra khỏi
          trang sản phẩm ngay sau cú bấm đầu tiên là bắt bấm lùi để xem tiếp. */}
      {added && (
        <p className="cart-add-done" role="status">
          Đã thêm vào giỏ. <Link href="/gio-hang">Xem giỏ hàng và đặt</Link>
        </p>
      )}
      <p className="cart-add-note">{siteConfig.quantityPricing}</p>
    </div>
  );
}
