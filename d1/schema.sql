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

-- ---------------------------------------------------------------------------------------
-- Đơn từ GIỎ HÀNG (/gio-hang -> functions/api/dat-hang.js).
--
-- Tách khỏi design_orders chứ không nhét chung: đơn thiết kế riêng là 1 mẫu + 1 ảnh, còn đơn
-- giỏ hàng có nhiều dòng hàng, có địa chỉ giao, có phương thức thanh toán và có trạng thái.
-- Nhồi cả hai vào một bảng thì nửa số cột luôn NULL và không ai đọc ra được ý nghĩa nữa.
CREATE TABLE IF NOT EXISTS shop_orders (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  -- Cùng dạng mã và cùng hàm sinh với design_orders (TK-8F3K) — khách đọc mã qua điện thoại,
  -- và với đơn chuyển khoản thì đây CHÍNH LÀ nội dung chuyển khoản.
  code            TEXT NOT NULL UNIQUE,
  customer_name   TEXT NOT NULL,
  phone           TEXT NOT NULL,

  -- Địa chỉ giao. Lưu CẢ MÃ LẪN TÊN là cố ý: mã để tính phí ship và tra cứu chính xác, tên để
  -- đọc lại đơn cũ. Đơn vị hành chính có lúc đổi tên hoặc sáp nhập — giữ tên đã chép thì đơn
  -- cũ vẫn in ra đúng địa chỉ khách đã nhập, thay vì lặng lẽ hiển thị theo tên mới.
  province_code   TEXT NOT NULL,
  province_name   TEXT NOT NULL,
  ward_code       TEXT NOT NULL,
  ward_name       TEXT NOT NULL,
  address_line    TEXT NOT NULL,              -- số nhà, tên đường — phần dropdown không phủ được

  payment_method  TEXT NOT NULL,              -- 'cod' | 'transfer'

  -- Tiền để INTEGER, đơn vị đồng. VND không có phần lẻ, mà dùng số thực thì có ngày tổng đơn
  -- ghi vào D1 thành 756199.9999999999.
  subtotal        INTEGER NOT NULL,
  discount_rate   REAL    NOT NULL,           -- 0 | 0.05 | 0.12 — chép lại bậc ĐÃ áp lúc đặt
  discount        INTEGER NOT NULL,
  shipping_fee    INTEGER NOT NULL,
  total           INTEGER NOT NULL,

  -- Giá trị tiếng Anh, để khớp tên cột/giá trị enum ở mọi nơi khác trong D1 (bảng này là bảng
  -- duy nhất từng có giá trị tiếng Việt, gây lệch khi lọc/thống kê bằng SQL thuần).
  -- 'pending_payment'      : đơn chuyển khoản, đã tạo mã, chưa thấy tiền
  -- 'pending_confirmation' : COD vừa đặt, hoặc chuyển khoản đã gửi ảnh — chờ người gọi xác nhận
  -- 'confirmed' | 'cancelled'
  status          TEXT NOT NULL,
  receipt_key     TEXT,                       -- khoá object trên R2, NULL khi chưa gửi ảnh
  notes           TEXT,
  order_date      TEXT NOT NULL               -- ISO 8601 UTC, cùng quy ước design_orders
);

CREATE INDEX IF NOT EXISTS idx_shop_orders_date   ON shop_orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_shop_orders_phone  ON shop_orders(phone);
CREATE INDEX IF NOT EXISTS idx_shop_orders_status ON shop_orders(status);

-- Từng dòng hàng trong đơn.
--
-- variant_name và unit_price là BẢN CHÉP tại thời điểm đặt, không phải tham chiếu sang
-- Airtable. Giá trên Airtable đổi rồi build lại là giá hiện tại đổi theo — nhưng đơn cũ phải
-- giữ đúng con số khách đã đồng ý trả. Không chép thì lịch sử đơn tự viết lại sau lưng mình.
CREATE TABLE IF NOT EXISTS shop_order_items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  order_code   TEXT    NOT NULL REFERENCES shop_orders(code),
  variant_href TEXT    NOT NULL,              -- khoá tra ngược sang kb.json / trang sản phẩm
  variant_name TEXT    NOT NULL,
  unit_price   INTEGER NOT NULL,
  quantity     INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shop_order_items_order ON shop_order_items(order_code);
