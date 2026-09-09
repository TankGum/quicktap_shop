'use client';

// Giỏ hàng + đặt hàng, tất cả trên một trang (/gio-hang).
//
// Site là static export nên toàn bộ phần này chạy ở trình duyệt; mọi thứ có thật (giá, đơn,
// mã QR) đều do Pages Function quyết định. Con số hiện ở đây chỉ để khách nhìn — nó tính bằng
// CÙNG hàm priceCart mà functions/api/dat-hang.js dùng, nên hai bên không lệch được. Nhưng
// tiền ghi vào D1 luôn là tiền server tự dựng lại, không phải con số dưới đây.
//
// Hai file dữ liệu tải ngay khi vào trang:
//   /kb.json    — tên + giá từng mẫu (sinh lúc build từ Airtable) và cấu hình bậc giảm
//   /diachi.json — danh mục tỉnh/phường cho hai ô chọn địa chỉ (~143KB, chỉ trang này cần)

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { useCart } from '@/components/CartStore';
import ProgressiveImg from '@/components/ProgressiveImg';
import { catalogFromKb, priceCart } from '@/lib/cartPricing.mjs';
import { siteConfig } from '@/lib/siteConfig';
import { PRODUCTS_HREF } from '@/data/products';
// Luật kiểm tra dùng CHUNG với functions/api/dat-hang.js — chốt chặn thật nằm ở server, ở đây
// chỉ dùng lại để quyết định LÚC NÀO cho bấm nút, không phải để thay thế nó.
import { normalizePhone } from '@/lib/orderValidation';
import { resolveAddress, validateCheckout } from '@/lib/checkoutValidation.mjs';
import { ShoppingCart } from 'lucide-react';

const vnd = (n) => `${Number(n).toLocaleString('vi-VN')}đ`;

const EMPTY_FORM = {
  name: '',
  phone: '',
  provinceCode: '',
  wardCode: '',
  addressLine: '',
  paymentMethod: 'cod',
  note: '',
};

export default function CheckoutView() {
  const { items, setQty, remove, clear } = useCart();

  const [kb, setKb] = useState(null);
  const [diaGioi, setDiaGioi] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState('');
  const [order, setOrder] = useState(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch('/kb.json').then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status)))),
      fetch('/diachi.json').then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status)))),
    ])
      .then(([k, d]) => {
        if (!alive) return;
        setKb(k);
        setDiaGioi(d);
      })
      .catch(() => alive && setLoadError(true));
    return () => {
      alive = false;
    };
  }, []);

  const catalog = useMemo(() => (kb ? catalogFromKb(kb) : new Map()), [kb]);

  const priced = useMemo(() => {
    if (!kb) return null;
    return priceCart({
      items,
      catalog,
      provinceCode: form.provinceCode || null,
      config: {
        quantityTiers: kb.pricing?.quantityTiers || siteConfig.quantityTiers,
        freeProvinceCode: kb.pricing?.freeProvinceCode || siteConfig.shippingFreeProvinceCode,
        flatFee: kb.pricing?.flatFee ?? siteConfig.shippingFlatFee,
      },
    });
  }, [kb, items, catalog, form.provinceCode]);

  // Tính Ở CLIENT chứ không chỉ chặn ở server: để khách chọn được rồi điền hết form mới báo
  // "chuyển khoản tạm không khả dụng" là bắt họ đi hết một quãng đường cụt. Cùng lý do khiến
  // nút "Thêm vào giỏ" ẩn hẳn với mẫu hết hàng.
  const transferEnabled = Boolean(siteConfig.bank?.bin && siteConfig.bank?.accountNo);

  const province = useMemo(
    () => diaGioi?.provinces.find((p) => p.code === form.provinceCode) || null,
    [diaGioi, form.provinceCode]
  );

  const address = useMemo(
    () => (diaGioi ? resolveAddress(diaGioi, form.provinceCode, form.wardCode) : null),
    [diaGioi, form.provinceCode, form.wardCode]
  );

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  async function submit(e) {
    e.preventDefault();
    setFailure('');

    // Validate Ở CLIENT trước — cùng luật với server (functions/api/dat-hang.js) — để báo lỗi
    // ngay dưới từng ô mà không phải tốn một lượt gọi mạng cho thứ đã biết trước là sai. Đây
    // KHÔNG phải chốt chặn thật: server luôn tự validate lại từ đầu, không tin bất cứ gì
    // trình duyệt gửi lên, vì trình duyệt thì ai cũng sửa được.
    const check = validateCheckout(form, { normalizePhone, address, transferEnabled });
    if (!check.ok) {
      setErrors(check.errors);
      // Nút nằm trong thẻ tóm tắt (aside), cách xa các ô đang lỗi phía trên — không có câu
      // này thì khách bấm xong chẳng thấy gì đổi, tưởng nút bị đơ.
      setFailure('Bạn điền đủ thông tin có dấu * ở trên giúp mình nhé.');
      return;
    }

    setSending(true);
    setErrors({});
    try {
      const res = await fetch('/api/dat-hang', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          // Chỉ gửi mã và số lượng. Mọi con số tiền do server tự dựng lại — xem chú thích đầu
          // functions/api/dat-hang.js.
          items: items.map((it) => ({ href: it.href, qty: it.qty })),
          ...form,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(data.errors && !Array.isArray(data.errors) ? data.errors : {});
        setFailure(data.message || 'Đặt hàng không thành công, bạn thử lại giúp mình.');
        return;
      }
      setOrder(data);
      clear();
    } catch {
      setFailure('Không gửi được đơn. Bạn kiểm tra kết nối rồi thử lại giúp mình.');
    } finally {
      setSending(false);
    }
  }

  if (order) return <OrderDone order={order} phone={form.phone} />;

  if (loadError) {
    return (
      <p className="ck-alert">
        Không tải được bảng giá. Bạn tải lại trang, hoặc gọi{' '}
        <a href={siteConfig.phoneHref}>{siteConfig.phoneDisplay}</a> để đặt trực tiếp.
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <div className="ck-empty">
        <ShoppingCart className="ck-empty-icon" aria-hidden="true" />
        <p>Giỏ hàng đang trống.</p>
        <Link className="btn btn-primary" href={PRODUCTS_HREF}>Xem sản phẩm</Link>
      </div>
    );
  }

  if (!priced) return <p className="ck-loading">Đang tải bảng giá…</p>;

  const blocked = priced.errors.length > 0;

  return (
    <div className="ck">
    <div className="ck-main">
      <section className="ck-lines" aria-labelledby="ck-cart-title">
        <div className="ck-lines-head">
          <h2 id="ck-cart-title">Sản phẩm trong giỏ</h2>
          <span>{priced.totalQty} sản phẩm</span>
        </div>
        {priced.lines.map((l) => (
          <div className="ck-line" key={l.href}>
            {/* ProgressiveImg thay cho <img> thường ở mọi chỗ hiện ảnh sản phẩm: nó xin
                Cloudinary bản đúng cỡ (thumbnail 64px không cần tải PNG 1,5MB) và hiện dần lên
                thay vì nhấp nháy. Alt rỗng vì tên mẫu nằm ngay bên cạnh — trình đọc màn hình
                đọc lặp hai lần thì phiền hơn là giúp. */}
            {l.image
              ? <ProgressiveImg className="ck-thumb" src={l.image} alt="" sizes="64px" />
              : <span className="ck-thumb ck-thumb-none" aria-hidden="true" />}
            <div className="ck-line-main">
              <Link className="ck-line-name" href={l.href}>{l.name}</Link>
              <span className="ck-line-unit">{vnd(l.unitPrice)} / cái</span>
            </div>
            <div className="ck-line-qty">
              <button type="button" onClick={() => setQty(l.href, l.qty - 1)} aria-label={`Bớt ${l.name}`}>−</button>
              <input
                type="number"
                min="1"
                max="999"
                value={l.qty}
                onChange={(e) => setQty(l.href, Math.max(1, Math.min(999, Number(e.target.value) || 1)))}
                aria-label={`Số lượng ${l.name}`}
              />
              <button type="button" onClick={() => setQty(l.href, l.qty + 1)} aria-label={`Thêm ${l.name}`}>+</button>
            </div>
            <div className="ck-line-total">{vnd(l.lineTotal)}</div>
            <button type="button" className="ck-line-remove" onClick={() => remove(l.href)} aria-label={`Bỏ ${l.name} khỏi giỏ`}>
              Xoá
            </button>
          </div>
        ))}

        {/* Mẫu bị gỡ hoặc hết hàng kể từ lúc khách bỏ vào giỏ. Giỏ ở localStorage sống lâu hơn
            một lần build nên chuyện này bình thường — nói rõ và cho xoá, không im lặng bỏ qua. */}
        {priced.errors.map((e) => (
          <div className="ck-line ck-line-bad" key={e.href}>
            <span className="ck-thumb ck-thumb-none" aria-hidden="true" />
            <div className="ck-line-main">
              <span className="ck-line-name">{e.href}</span>
              <span className="ck-line-unit">
                {e.reason === 'het-hang' && 'Mẫu này đã hết hàng'}
                {e.reason === 'chua-niem-yet' && 'Mẫu này chưa niêm yết giá, cần gọi hỏi'}
                {e.reason === 'khong-ton-tai' && 'Mẫu này không còn bán'}
                {e.reason === 'so-luong-khong-hop-le' && 'Số lượng không hợp lệ'}
              </span>
            </div>
            <button type="button" className="ck-line-remove" onClick={() => remove(e.href)}>Xoá</button>
          </div>
        ))}
      </section>

      <form id="ck-form" className="ck-form" onSubmit={submit} noValidate>
        <h2 className="ck-h2"><span className="ck-step">1</span>Thông tin nhận hàng</h2>

        <Field required label="Tên người nhận" error={errors.name}>
          <input className="ck-input" required value={form.name} onChange={(e) => set({ name: e.target.value })} autoComplete="name" />
        </Field>

        <Field required label="Số điện thoại" error={errors.phone}>
          <input className="ck-input" type="tel" required value={form.phone} onChange={(e) => set({ phone: e.target.value })} autoComplete="tel" />
        </Field>

        <Field required label="Tỉnh / Thành phố" error={errors.address}>
          <select
            className="ck-input"
            required
            value={form.provinceCode}
            onChange={(e) => set({ provinceCode: e.target.value, wardCode: '' })}
            disabled={!diaGioi}
          >
            <option value="">{diaGioi ? '— Chọn tỉnh/thành —' : 'Đang tải…'}</option>
            {diaGioi?.provinces.map((p) => (
              <option key={p.code} value={p.code}>{p.name}</option>
            ))}
          </select>
        </Field>

        <Field required label="Phường / Xã" error={errors.address}>
          <select
            className="ck-input"
            required
            value={form.wardCode}
            onChange={(e) => set({ wardCode: e.target.value })}
            disabled={!province}
          >
            <option value="">{province ? '— Chọn phường/xã —' : 'Chọn tỉnh/thành trước'}</option>
            {province?.wards.map((w) => (
              <option key={w.code} value={w.code}>{w.name}</option>
            ))}
          </select>
        </Field>

        <Field wide required label="Số nhà, tên đường" error={errors.addressLine}>
          <input className="ck-input" required value={form.addressLine} onChange={(e) => set({ addressLine: e.target.value })} autoComplete="street-address" />
        </Field>

        <Field wide label="Ghi chú (không bắt buộc)" error={errors.note}>
          <textarea className="ck-input" rows={2} value={form.note} onChange={(e) => set({ note: e.target.value })} />
        </Field>

        <h2 className="ck-h2"><span className="ck-step">2</span>Thanh toán</h2>
        <div className="ck-pay" role="radiogroup" aria-label="Hình thức thanh toán">
          <label className="ck-pay-opt">
            <input type="radio" name="pay" value="cod" checked={form.paymentMethod === 'cod'} onChange={() => set({ paymentMethod: 'cod' })} />
            <span className="ck-pay-text">
              <b>Thanh toán khi nhận hàng</b>
              <em>Trả tiền mặt cho shipper, không cần trả trước.</em>
            </span>
          </label>

          {/* Chưa điền siteConfig.bank thì lựa chọn này không tồn tại — xem transferEnabled. */}
          {transferEnabled && (
            <label className="ck-pay-opt">
              <input type="radio" name="pay" value="transfer" checked={form.paymentMethod === 'transfer'} onChange={() => set({ paymentMethod: 'transfer' })} />
              <span className="ck-pay-text">
                <b>Chuyển khoản</b>
                <em>Đặt xong hiện mã QR điền sẵn số tiền và nội dung, không phải gõ tay.</em>
              </span>
            </label>
          )}
        </div>
        {errors.paymentMethod && <p className="ck-err">{errors.paymentMethod}</p>}
      </form>
    </div>

    <aside className="ck-aside">
      <div className="ck-card">
        <Summary priced={priced} hasProvince={Boolean(form.provinceCode)} />

        {failure && <p className="ck-alert" role="alert">{failure}</p>}

        {/* Nút nằm ngoài <form> nên phải nối bằng thuộc tính form=. Đặt trong thẻ tóm tắt là
            đúng chỗ mắt khách dừng lại cuối cùng — ngay dưới con số họ sắp trả.
            LUÔN bấm được (trừ lúc đang gửi hoặc giỏ còn dòng lỗi) — bấm xong mới validate, sai
            thì báo lỗi ngay dưới từng ô, không chặn từ trước khi khách kịp biết thiếu gì. Đây
            cũng chỉ là lớp gợi ý: server luôn tự kiểm tra lại toàn bộ trong mọi trường hợp. */}
        <button form="ck-form" className="btn btn-primary btn-lg ck-submit" type="submit" disabled={sending || blocked}>
          {sending ? 'Đang gửi đơn…' : 'Đặt hàng'}
        </button>
        {blocked && <p className="ck-err">Bạn xoá các dòng không đặt được ở trên rồi gửi lại giúp mình.</p>}

        <p className="ck-aside-note">{siteConfig.shippingPolicy}</p>
      </div>
    </aside>
  </div>
  );
}

// `wide` = ô trải hết hai cột của lưới form. Dùng cho những ô mà nội dung dài (địa chỉ, ghi
// chú); các ô ngắn thì đứng cặp cho form đỡ lê thê.
// `required` khai báo ngữ nghĩa các trường bắt buộc; submit vẫn dùng validation riêng
// để hiện thông báo nhất quán và chặn request API khi dữ liệu chưa hợp lệ.
function Field({ label, error, wide, required, children }) {
  return (
    <label className={wide ? 'ck-field ck-field-wide' : 'ck-field'}>
      <span className="ck-label">
        {label}
        {required && <span className="ck-required" aria-hidden="true"> *</span>}
      </span>
      {children}
      {error && <span className="ck-err">{error}</span>}
    </label>
  );
}

function Summary({ priced, hasProvince }) {
  return (
    <dl className="ck-sum">
      <div><dt>Tạm tính</dt><dd>{vnd(priced.subtotal)}</dd></div>
      {priced.discount > 0 && (
        <div className="ck-sum-off">
          <dt>Giảm {Math.round(priced.discountRate * 100)}% (từ {priced.totalQty} cái)</dt>
          <dd>−{vnd(priced.discount)}</dd>
        </div>
      )}
      <div>
        <dt>Phí giao</dt>
        <dd>
          {!hasProvince ? <span className="ck-sum-pending">chọn tỉnh/thành để biết</span>
            : priced.shipping === 0 ? 'Miễn phí' : vnd(priced.shipping)}
        </dd>
      </div>
      <div className="ck-sum-total">
        <dt>Tổng cộng</dt>
        <dd>{priced.total === null ? '—' : vnd(priced.total)}</dd>
      </div>
    </dl>
  );
}

// ---------- Sau khi đặt xong ----------

function OrderDone({ order, phone }) {
  const transfer = order.payment?.method === 'transfer';
  return (
    <div className="ck-done">
      <p className="ck-done-mark" aria-hidden="true">✓</p>
      <h2 className="ck-done-title">Đã nhận đơn {order.code}</h2>
      <p className="ck-done-sub">
        Bọn mình sẽ gọi <b>{phone}</b> để xác nhận. Bạn ghi lại mã <b>{order.code}</b> để tra cứu khi cần.
      </p>

      {transfer ? <TransferPanel order={order} phone={phone} /> : (
        <p className="ck-done-note">
          Tổng tiền <b>{vnd(order.total)}</b>, bạn trả cho shipper khi nhận hàng.
        </p>
      )}

      <Link className="btn btn-ghost" href={PRODUCTS_HREF}>Tiếp tục xem sản phẩm</Link>
    </div>
  );
}

function TransferPanel({ order, phone }) {
  const { bank, qrPayload, amount } = order.payment;
  return (
    <div className="ck-pay-panel">
      <p className="ck-pay-amount">Chuyển <b>{vnd(amount)}</b>, nội dung <b>{order.code}</b></p>

      {/* QR dựng từ chuỗi do SERVER sinh — số tiền trong mã là số server đã ghi vào đơn, không
          phải con số trình duyệt tự tính. */}
      {qrPayload ? (
        <div className="ck-qr">
          <QRCodeSVG value={qrPayload} size={220} level="M" marginSize={2} />
        </div>
      ) : (
        <p className="ck-err">Không dựng được mã QR, bạn chuyển khoản theo thông tin bên dưới giúp mình.</p>
      )}

      {/* Phần chữ LUÔN hiện, kể cả khi có QR: nhiều người vẫn chuyển bằng cách gõ tay, và quét
          mã thì có đủ lý do để hỏng. QR là đường tắt, không phải đường duy nhất. */}
      <dl className="ck-bank">
        <div><dt>Ngân hàng</dt><dd>{bank.name}</dd></div>
        <div><dt>Số tài khoản</dt><dd><CopyText value={bank.accountNo} /></dd></div>
        <div><dt>Chủ tài khoản</dt><dd>{bank.accountName}</dd></div>
        <div><dt>Số tiền</dt><dd><CopyText value={String(amount)} label={vnd(amount)} /></dd></div>
        <div><dt>Nội dung</dt><dd><CopyText value={order.code} /></dd></div>
      </dl>

      <ReceiptUpload code={order.code} phone={phone} />
    </div>
  );
}

function CopyText({ value, label }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="ck-copy"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* trình duyệt chặn clipboard — chữ vẫn chọn tay được */
        }
      }}
    >
      <span>{label || value}</span>
      <span className="ck-copy-hint">{copied ? 'đã chép' : 'chép'}</span>
    </button>
  );
}

function ReceiptUpload({ code, phone }) {
  const inputRef = useRef(null);
  const [state, setState] = useState('idle'); // idle | sending | done | error
  const [message, setMessage] = useState('');

  async function send(file) {
    if (!file) return;
    setState('sending');
    setMessage('');
    try {
      const body = new FormData();
      body.append('code', code);
      body.append('phone', phone);
      body.append('file', file);
      const res = await fetch('/api/dat-hang/bien-lai', { method: 'POST', body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState('error');
        setMessage(data.message || 'Gửi ảnh không thành công.');
        return;
      }
      setState('done');
    } catch {
      setState('error');
      setMessage('Không gửi được ảnh. Bạn thử lại hoặc gửi qua Zalo giúp mình.');
    }
  }

  if (state === 'done') {
    return <p className="ck-receipt-done" role="status">Đã nhận ảnh chuyển khoản. Bọn mình sẽ đối chiếu rồi gọi xác nhận.</p>;
  }

  return (
    <div className="ck-receipt">
      <p className="ck-receipt-hint">
        Chuyển xong, gửi ảnh chụp màn hình để bọn mình đối chiếu nhanh hơn. Không bắt buộc — đơn của bạn đã được lưu rồi.
      </p>
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => send(e.target.files?.[0])}
      />
      <button type="button" className="btn btn-outline" onClick={() => inputRef.current?.click()} disabled={state === 'sending'}>
        {state === 'sending' ? 'Đang gửi ảnh…' : 'Gửi ảnh chuyển khoản'}
      </button>
      {message && <p className="ck-err">{message}</p>}
    </div>
  );
}
