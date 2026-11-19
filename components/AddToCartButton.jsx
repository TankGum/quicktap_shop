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
import { hasMonthlyPlan, isOutOfStock, parsePrice } from '@/lib/cartPricing.mjs';
import { siteConfig } from '@/lib/siteConfig';
import { ShoppingCart } from 'lucide-react';

export default function AddToCartButton({ variant }) {
  const { add } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [plan, setPlan] = useState('buy');
  const monthly = hasMonthlyPlan(variant);

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
      {/* Hai cách mua. Mẫu chưa có giá tháng trên Airtable thì không hiện cụm chọn — chỉ có mua
          đứt, cùng luật với priceCart ở server (lib/cartPricing.mjs). */}
      {monthly && (
        <fieldset className="plan-pick">
          <legend className="sr-only">Chọn cách mua</legend>
          <label className={`plan-opt${plan === 'buy' ? ' is-on' : ''}`}>
            <input type="radio" name="plan" value="buy" checked={plan === 'buy'} onChange={() => setPlan('buy')} />
            <span className="plan-opt-name">{siteConfig.plans.buy.label}</span>
            <span className="plan-opt-rows">
              <span className="plan-opt-row"><span>Giá mua đứt</span><b>{variant.price}</b></span>
            </span>
            <span className="plan-opt-desc">{siteConfig.plans.buy.short}</span>
          </label>
          <label className={`plan-opt${plan === 'monthly' ? ' is-on' : ''}`}>
            <input type="radio" name="plan" value="monthly" checked={plan === 'monthly'} onChange={() => setPlan('monthly')} />
            <span className="plan-opt-name">{siteConfig.plans.monthly.label}</span>
            <span className="plan-opt-rows">
              <span className="plan-opt-row">
                <span>Trả lúc mua <small>(gồm tháng đầu)</small></span><b>{variant.upfrontPrice}</b>
              </span>
              <span className="plan-opt-row">
                <span>Phí hằng tháng <small>(từ tháng 2)</small></span><b>{variant.monthlyFee}</b>
              </span>
            </span>
            <span className="plan-opt-desc">Chuyển khoản theo mã thẻ, nhắc hạn trước {siteConfig.monthlyPlan.remindDaysBefore} ngày.</span>
          </label>
        </fieldset>
      )}

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
            add(variant.href, qty, plan);
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
            add(variant.href, qty, plan);
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
      <p className="cart-add-note">
        {siteConfig.quantityPricing}
        {monthly && <> <Link href="/#cach-mua">Xem cách tính phí trả theo tháng</Link></>}
      </p>
    </div>
  );
}
