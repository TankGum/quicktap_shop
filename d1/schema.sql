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

-- Nhật ký khung chat (functions/api/chat.js). Mục đích DUY NHẤT: đọc lại xem khách hay hỏi gì
-- để vá phần kiến thức và viết lại FAQ — đó là giá trị lớn nhất của con chat sau vài tuần.
--
-- Nội dung đã được ẨN DANH HOÁ trước khi ghi (lib/chatRedact.mjs): số điện thoại -> [SĐT],
-- mã đơn -> [MÃ ĐƠN], email -> [EMAIL]. Cố ý như vậy: khung chat vừa tư vấn vừa tra đơn nên
-- khách sẽ tự gõ số điện thoại và mã đơn vào, mà ghi nguyên văn là biến bảng này thành nơi
-- chứa thông tin cá nhân THỨ HAI bên cạnh design_orders — trong khi thứ đáng đọc lại chỉ là
-- "khách hỏi gì", không cần biết ai hỏi.
CREATE TABLE IF NOT EXISTS chat_logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  -- Mã phiên do trình duyệt sinh (sessionStorage), chỉ để nối các dòng của cùng một cuộc trò
  -- chuyện lại khi đọc. Không tra ngược ra người được.
  session_id TEXT NOT NULL,
  role       TEXT NOT NULL,   -- 'user' | 'assistant'
  content    TEXT NOT NULL,   -- ĐÃ ẩn danh hoá
  -- Chi phí Workers AI của lượt đó, chỉ có ở dòng 'assistant'. Ghi ngay từ đầu để sau vài
  -- ngày còn biết một lượt chat thật tốn bao nhiêu mà chỉnh GLOBAL_LIMIT cho đúng — hạn mức
  -- miễn phí là 10.000 neuron/ngày, đoán bừa thì hoặc chặn oan khách hoặc vỡ hạn mức.
  neurons    REAL,
  created_at TEXT NOT NULL    -- ISO 8601, giờ UTC — cùng quy ước với design_orders.order_date
);

-- Đọc theo cuộc trò chuyện (hay dùng nhất) và đọc lượt mới nhất trước.
CREATE INDEX IF NOT EXISTS idx_chat_logs_session ON chat_logs(session_id, id);
CREATE INDEX IF NOT EXISTS idx_chat_logs_date    ON chat_logs(created_at DESC);
