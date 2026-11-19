-- Thêm "cách mua" cho từng dòng hàng (mua đứt / trả theo tháng) — xem d1/schema.sql.
--
-- CHỈ chạy MỘT lần trên DB đã có bảng shop_order_items từ trước. SQLite không có
-- "ADD COLUMN IF NOT EXISTS": chạy lần hai sẽ báo "duplicate column name" — lỗi đó vô hại,
-- nghĩa là cột đã có rồi. DB tạo mới từ d1/schema.sql thì đã có sẵn 2 cột, KHÔNG cần file này.
--
--   npx wrangler d1 execute quicktap-orders --remote --file=d1/migrations/2026-11-19-plan.sql
--
-- PHẢI chạy TRƯỚC khi deploy code mới: code mới INSERT vào 2 cột này, thiếu cột là mọi đơn
-- giỏ hàng trả 502. Dòng cũ tự nhận plan = 'buy' — đúng, vì trước đó chỉ có mua đứt.
ALTER TABLE shop_order_items ADD COLUMN plan TEXT NOT NULL DEFAULT 'buy';
ALTER TABLE shop_order_items ADD COLUMN monthly_fee INTEGER;
