#!/usr/bin/env bash
# Chạy MỘT lệnh ra đủ cả site lẫn backend: `npm run dev`.
#
# Vì sao phải có script này thay vì gọi thẳng `next dev`: site build ra HTML tĩnh
# (`output: 'export'` trong next.config.js) nên không có server Next lúc chạy, và toàn bộ
# backend nằm ở thư mục `functions/` — thứ chỉ Cloudflare Pages hiểu. `next dev` không biết
# thư mục đó tồn tại, nên gọi /api/thiet-ke-rieng hay /api/chat trên cổng của nó luôn ra 404.
#
# CÁCH LÀM: build tĩnh một lần (`next build` -> `out/`) rồi cho `wrangler pages dev` phục vụ
# nguyên thư mục đó — CÙNG PATTERN với `npm run preview` đã có sẵn trong repo trước khi tính
# năng chat tồn tại, và đúng cách Cloudflare khuyến nghị chính thức.
#
# Bản trước của script này dùng `wrangler pages dev --proxy <cổng next dev>` để có hot-reload
# thật. ĐÃ BỎ: `--proxy` là cờ deprecated (`wrangler pages dev --help` tự in "[deprecated]"),
# hành vi không nhất quán — có wrangler.jsonc khai `pages_build_output_dir` thì nó ưu tiên
# phục vụ file tĩnh CŨ trong `out/` thay vì proxy, gây ra sửa code không thấy hiệu lực mà
# không báo lỗi gì; không có thư mục nào thì lại 404 thẳng thừng. GitHub issue của chính
# workers-sdk nói thẳng: "proxy options prevent wrangler pages dev từ mô phỏng đúng hành vi
# production", khuyến nghị đúng là build ra thư mục rồi trỏ vào — thứ script này đang làm.
#
# ĐÁNH ĐỔI: sửa .jsx/.css xong phải BUILD LẠI mới thấy (không tự động). Trình duyệt tự refresh
# nhờ `--live-reload` của wrangler khi out/ đổi — chỉ cần chạy `npm run dev:rebuild` ở một tab
# khác rồi chờ trình duyệt tự nháy lại, không cần khởi động lại `npm run dev`.
#
# Chỉ sửa GIAO DIỆN, không đụng backend (chat/D1/KV): `npm run dev:next` (cổng 3001, next dev
# thật, hot reload tức thời) NHẸ HƠN NHIỀU cho việc đó.

set -uo pipefail
cd "$(dirname "$0")/.."

PORT="${PORT:-8788}"

# --- Node cho wrangler ---
# wrangler đòi Node >= 22. Ưu tiên node hệ thống nếu đủ mới; không thì dùng bản cài riêng
# trong ~/.local (cài kèm lúc dựng tính năng chat, không đụng node hệ thống).
FALLBACK_NODE="$HOME/.local/share/quicktap-node22/bin"
major=$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)
if [ "$major" -lt 22 ]; then
  if [ -x "$FALLBACK_NODE/node" ]; then
    export PATH="$FALLBACK_NODE:$PATH"
  else
    echo "LỖI: wrangler cần Node >= 22, máy đang chạy Node $(node -v 2>/dev/null || echo '?')." >&2
    echo "      Cài Node 22 (nvm install 22) rồi chạy lại, hoặc đặt lại $FALLBACK_NODE." >&2
    exit 1
  fi
fi

# --- Chặn va chạm với `next dev` đang chạy riêng (npm run dev:next, hoặc `next dev` tay) ---
# `next build` ghi vào `.next` — CÙNG thư mục `next dev` đang dùng, kể cả khi output:'export'
# đặt distDir khác (xem docs/superpowers/... hay hỏi lại: NEXT_DIST_DIR KHÔNG cách ly được,
# Next tự ép distDir về '.next' cho output:'export' — xem next.config.js). Build đè lên dev
# server đang chạy sẽ làm nó lỗi "Cannot find module './xxx.js'" và phải khởi động lại.
port_dang_dung() { (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null; }
if port_dang_dung 3001; then
  echo "LỖI: cổng 3001 đang có ai đó nghe — nếu đó là \`npm run dev:next\` (hoặc \`next dev\`" >&2
  echo "     chạy tay) thì tắt nó trước: build ở đây sẽ ghi đè \`.next\` mà nó đang dùng và" >&2
  echo "     làm hỏng phiên đó. Không liên quan thì đổi cổng: PORT=... npm run dev" >&2
  exit 1
fi

echo "→ Build tĩnh (next build)..."
npx next build
echo

# --- wrangler ---
# Có wrangler.jsonc ở gốc thì binding lấy từ đó (kể cả D1 remote: true); không có thì truyền
# bằng cờ để bản clone mới vẫn chạy được ngay. Xem README mục "Trợ lý chat".
BINDINGS=()
if [ ! -f wrangler.jsonc ] && [ ! -f wrangler.toml ]; then
  BINDINGS=(--kv KV_BINDING --d1 DB=e6ed458c-b10b-467e-a983-7036a5be91e2 --ai AI)
fi

echo "  ┌──────────────────────────────────────────────────┐"
echo "  │  Mở http://localhost:$PORT                          │"
echo "  │  Sửa .jsx/.css xong: npm run dev:rebuild (tab khác) │"
echo "  └──────────────────────────────────────────────────┘"
echo

# --live-reload: trình duyệt tự tải lại khi file trong `out/` đổi (vd sau khi bạn chạy
# `npm run dev:rebuild` ở tab khác) — không cần khởi động lại lệnh này.
exec npx --yes wrangler@4 pages dev out --live-reload --port "$PORT" "${BINDINGS[@]}"
