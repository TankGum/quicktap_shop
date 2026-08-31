-- Bảng đơn "Thiết kế riêng" — thay cho bảng Airtable cũ (xem README mục "Nhận đơn Thiết kế
-- riêng"). Cột giữ nguyên đúng những thông tin bảng Airtable từng có, chỉ đổi tên sang
-- snake_case cho hợp SQL.
--
-- Chạy lại file này bất cứ lúc nào cũng an toàn (IF NOT EXISTS):
--   npx wrangler d1 execute quicktap-orders --remote --file=d1/schema.sql   # DB thật
--   npx wrangler d1 execute quicktap-orders --local  --file=d1/schema.sql   # DB máy, cho `npm run preview`

CREATE TABLE IF NOT EXISTS design_orders (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  -- Mã đơn hiện cho khách ngay sau khi gửi (TK-8F3K) và cũng là tên file trên Cloudinary.
  -- Thời Airtable mã này không được lưu thành cột; ở SQL thì nó là khoá tự nhiên để tra đơn
  -- khi khách gọi điện đọc mã, nên giữ hẳn một cột UNIQUE.
  code            TEXT NOT NULL UNIQUE,
  customer_name   TEXT NOT NULL,              -- tên quán
  phone           TEXT NOT NULL,
  quantity        INTEGER NOT NULL DEFAULT 1,
  notes           TEXT,                       -- ghi chú của khách, có thể rỗng
  cloudinary_link TEXT NOT NULL,              -- link ảnh mẫu khách đã chốt
  order_date      TEXT NOT NULL               -- ISO 8601, giờ UTC (vd 2026-08-31T04:12:09.123Z)
);

-- Tra đơn mới nhất trước (màn hình hay dùng nhất) và tra theo số điện thoại lúc khách gọi lại.
CREATE INDEX IF NOT EXISTS idx_design_orders_date  ON design_orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_design_orders_phone ON design_orders(phone);
