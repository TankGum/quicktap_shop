'use client';

// Khung chat nổi ở góc phải dưới, có mặt trên MỌI trang (gắn trong app/layout.js).
//
// Đi cặp với nút Zalo chứ không thay thế: nút này là máy trả lời ngay 24/7, nút kia là người
// thật trả lời sau — khách tự chọn. Zalo vẫn nằm dưới cùng vì đó là kênh đang mang đơn thật về.
//
// Không có JS thì component này không render gì (nó là client component), khung chat biến mất
// và nút Zalo vẫn còn nguyên — đúng nguyên tắc của repo: trang phải đọc và dùng được đầy đủ
// khi JS không chạy.
//
// Backend là functions/api/chat.js (Cloudflare Pages Function), phát về một luồng SSE với
// đúng ba dạng khung: {"t":"..."} một mẩu chữ, {"done":true} hết câu, {"error":"..."} đứt.

import { useCallback, useEffect, useRef, useState } from 'react';
// Icon lấy từ lucide-react (MIT) thay vì tự vẽ path SVG. Thư viện cài qua npm nên nó được
// đóng gói vào bundle của chính mình lúc build — KHÔNG có request nào ra CDN ngoài lúc chạy,
// vẫn đúng nguyên tắc của repo (xem README). Tree-shaking nên chỉ hai icon dưới đây được gói,
// không kéo theo cả bộ.
import { Minus, SendHorizontal } from 'lucide-react';
import { splitSseEvents, sseData } from '@/lib/chatStream.mjs';
import { siteConfig } from '@/lib/siteConfig';

// Lời chào là chữ TĨNH, không phải câu do model sinh: mở khung chat ra mà phải chờ (và tốn
// một lượt gọi model) chỉ để đọc "chào bạn" thì vừa chậm vừa tốn tiền cho zero thông tin.
const GREETING =
  'Chào bạn! Mình là trợ lý của QuickTapReview. Bạn cần tư vấn bảng NFC / standee, hay muốn tra đơn đã đặt?';

// Gợi ý bấm nhanh — đồng thời là cách nói cho khách biết khung chat này trả lời được gì.
const MAX_INPUT_CHARS = 500;

const SUGGESTIONS = [
  'Giá bao nhiêu 1 cái?',
  'Lợi ích sử dụng là gì?',
  'Cách sử dụng như nào?',
  // Lời chào đã mời khách "tra đơn đã đặt" nhưng trước đây không có mẫu nào để bấm, nên chỉ
  // ai tự nghĩ ra cách hỏi mới dùng tới. Bot trả lời được câu này mà không cần sửa prompt:
  // luật xin đủ mã đơn + số điện thoại đã nằm ở lib/chatPrompt.mjs.
  'Cách check đơn?',
];

// Giữ hội thoại trong sessionStorage chứ KHÔNG phải localStorage: khách có thể vừa gõ mã đơn
// và số điện thoại vào đây để tra đơn, đóng tab thì nên hết. localStorage giữ mãi trên máy
// dùng chung (quán cà phê, máy quầy) là chuyện khác hẳn.
const STORE_KEY = 'qtr-chat';

// Khoá RIÊNG cho trạng thái thu nhỏ, tách khỏi STORE_KEY vì hai thứ được ghi ở hai nhịp khác
// nhau: hội thoại chỉ ghi khi có tin nhắn, còn trạng thái thu nhỏ phải ghi ngay lúc khách bấm
// nút — kể cả khi họ chưa hỏi câu nào.
const MINIMIZED_KEY = 'qtr-chat-minimized';

function newSessionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(null);

  const sessionIdRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const panelRef = useRef(null);

  // Đọc sessionStorage trong effect chứ không lúc render: bản HTML tĩnh dựng lúc build không
  // biết gì về máy khách, đọc lúc render là lệch hydrate.
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORE_KEY) || 'null');
      if (saved?.sessionId) sessionIdRef.current = saved.sessionId;
      if (Array.isArray(saved?.messages)) setMessages(saved.messages);
    } catch {
      /* chế độ riêng tư chặn sessionStorage — chat vẫn chạy, chỉ là không nhớ giữa các trang */
    }
    if (!sessionIdRef.current) sessionIdRef.current = newSessionId();

    // Mặc định MỞ SẴN khi khách vào trang — nhưng chỉ khi họ chưa chủ động thu nhỏ nó trong
    // phiên này. Thu nhỏ rồi mà cứ chuyển trang là nó bật lại thì thành phiền, không phải
    // tiện. Trạng thái nằm ở sessionStorage nên đóng tab là quên, lần sau vào lại mở như mới.
    //
    // Mở trong effect chứ không phải useState(true): bản HTML tĩnh dựng lúc build không biết
    // khách đã thu nhỏ hay chưa, để nó render sẵn trạng thái mở thì người đã thu nhỏ sẽ thấy
    // khung loé lên một nhịp rồi mới biến mất. Mở ở đây còn được hưởng luôn hiệu ứng trượt vào.
    try {
      if (sessionStorage.getItem(MINIMIZED_KEY) !== '1') setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  // Đổi trạng thái mở/thu nhỏ VÀ nhớ lựa chọn đó. Mọi nút đều đi qua đây, không gọi setOpen
  // trực tiếp — nếu không thì có đường thu nhỏ mà không được ghi nhớ, và khung sẽ bật lại ở
  // trang kế tiếp.
  const doiTrangThai = useCallback((next) => {
    setOpen(next);
    try {
      sessionStorage.setItem(MINIMIZED_KEY, next ? '0' : '1');
    } catch {
      /* chế độ riêng tư chặn sessionStorage — vẫn đóng/mở được, chỉ là không nhớ qua trang */
    }
  }, []);

  useEffect(() => {
    if (!messages.length) return;
    try {
      sessionStorage.setItem(
        STORE_KEY,
        JSON.stringify({ sessionId: sessionIdRef.current, messages })
      );
    } catch {
      /* xem trên */
    }
  }, [messages]);

  // Luôn cuộn xuống mẩu chữ mới nhất, kể cả lúc model đang gõ dần.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streaming, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Esc để đóng — khung chat che gần hết màn hình điện thoại, phải có đường thoát bằng bàn phím.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') doiTrangThai(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, doiTrangThai]);

  const send = useCallback(
    async (raw) => {
      const text = String(raw ?? '').trim();
      if (!text || streaming) return;

      setError(null);
      setInput('');

      // Lịch sử gửi lên PHẢI là bản vừa thêm câu mới, không phải `messages` của lần render
      // trước — nếu không thì câu vừa gõ bị bỏ sót khỏi ngữ cảnh.
      const next = [...messages, { role: 'user', content: text }];
      setMessages(next);
      setStreaming(true);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ messages: next, sessionId: sessionIdRef.current }),
        });

        if (!res.ok || !res.body) {
          // Endpoint luôn trả JSON kèm `message` cho mọi mã lỗi (429 kèm số phút phải chờ,
          // 503 lúc thiếu cấu hình) — hiện đúng câu đó thay vì một lỗi kỹ thuật cụt lủn.
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'Không kết nối được với trợ lý.');
        }

        // Thêm sẵn một bong bóng rỗng của trợ lý rồi bơm chữ dần vào — khách thấy nó bắt đầu
        // trả lời ngay, không phải nhìn màn hình trống chờ nguyên câu.
        setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let got = false;

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const { events, rest } = splitSseEvents(buffer);
          buffer = rest;

          for (const event of events) {
            const data = sseData(event);
            if (!data) continue;

            let frame;
            try {
              frame = JSON.parse(data);
            } catch {
              continue;
            }

            if (frame.error) throw new Error(frame.error);
            if (typeof frame.t === 'string' && frame.t) {
              got = true;
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                copy[copy.length - 1] = { ...last, content: last.content + frame.t };
                return copy;
              });
            }
          }
        }

        // Luồng đóng mà chưa có chữ nào: bỏ bong bóng rỗng đi, không để lại một ô trắng khó hiểu.
        if (!got) {
          setMessages((prev) => prev.slice(0, -1));
          throw new Error('Trợ lý chưa trả lời được. Bạn thử hỏi lại giúp mình.');
        }
      } catch (err) {
        setError(err.message || 'Có lỗi xảy ra.');
      } finally {
        setStreaming(false);
      }
    },
    [messages, streaming]
  );

  const onSubmit = (e) => {
    e.preventDefault();
    send(input);
  };

  return (
    <>
      <button
        type="button"
        className={open ? "chat-fab chat-fab-minimize" : "chat-fab"}
        onClick={() => doiTrangThai(!open)}
        aria-expanded={open}
        aria-controls="chat-panel"
        aria-label={open ? 'Thu nhỏ khung chat' : 'Mở khung chat với trợ lý'}
      >
        {open ? (
          <Minus size={22} strokeWidth={2.4} />
        ) : (
          <>
            {/* Ảnh robot là hình chính; chấm xanh ở góc báo trợ lý đang hoạt động.
                Dùng <img> thường chứ không phải next/image: site bật images.unoptimized cho
                static export nên next/image không thêm được gì, y như components/ZaloButton.jsx. */}
            <img
              className="chat-fab-photo"
              src="/assets/chatbot/chatbot.png"
              alt=""
              width="56"
              height="56"
              loading="eager"
              decoding="async"
            />
            <span className="chat-fab-badge" aria-hidden="true" />
          </>
        )}
      </button>

      {/* Dùng hidden thay vì bỏ hẳn khỏi DOM: giữ nguyên vị trí cuộn và ô nhập đang gõ dở khi
          khách đóng rồi mở lại khung chat. */}
      <div
        id="chat-panel"
        className="chat-panel"
        ref={panelRef}
        hidden={!open}
        role="dialog"
        aria-modal="false"
        aria-label="Trợ lý QuickTapReview"
      >
        <header className="chat-head">
          {/* Cùng ảnh robot với nút nổi — mở khung ra thấy đúng khuôn mặt vừa bấm. */}
          <img
            className="chat-avatar"
            src="/assets/chatbot/chatbot.png"
            alt=""
            width="36"
            height="36"
            loading="eager"
            decoding="async"
          />
          <div className="chat-head-text">
            <strong>Trợ lý QuickTapReview</strong>
            <span className="chat-head-sub">Trả lời ngay, 24/7</span>
          </div>
          {/* "Thu nhỏ" chứ không phải "Đóng": bấm vào đây không mất gì — hội thoại vẫn còn
              nguyên trong sessionStorage, panel chỉ ẩn đi và trở lại thành bong bóng nổi. Icon
              X dễ hiểu nhầm là "kết thúc/xoá cuộc trò chuyện". */}
          <button type="button" className="chat-close" onClick={() => doiTrangThai(false)} aria-label="Thu nhỏ khung chat">
            <Minus size={20} strokeWidth={2.4} />
          </button>
        </header>

        <div className="chat-list" ref={listRef}>
          <p className="chat-msg chat-msg-bot">{GREETING}</p>

          {messages.map((m, i) => (
            <p key={i} className={`chat-msg ${m.role === 'user' ? 'chat-msg-me' : 'chat-msg-bot'}`}>
              {m.content}
              {/* Con trỏ nhấp nháy ở đúng bong bóng đang được bơm chữ. */}
              {m.role === 'assistant' && streaming && i === messages.length - 1 && (
                <span className="chat-caret" aria-hidden="true" />
              )}
            </p>
          ))}

          {/* Lượt đầu: gợi ý sẵn vài câu, vừa đỡ phải nghĩ vừa cho biết chat này trả lời được gì. */}
          {messages.length === 0 && (
            <div className="chat-chips">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" className="chat-chip" onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {streaming && messages[messages.length - 1]?.role === 'user' && (
            <p className="chat-msg chat-msg-bot chat-typing" aria-live="polite">
              <span /><span /><span />
            </p>
          )}

          {error && (
            <p className="chat-error" role="alert">
              {error}{' '}
              <a href={siteConfig.phoneHref}>Gọi {siteConfig.phoneDisplay}</a>
            </p>
          )}
        </div>

        <form className="chat-form" onSubmit={onSubmit}>
          <input
            ref={inputRef}
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Bạn muốn hỏi gì?"
            maxLength={MAX_INPUT_CHARS}
            disabled={streaming}
            aria-label="Câu hỏi của bạn"
          />
          <button type="submit" className="chat-send" disabled={streaming || !input.trim()} aria-label="Gửi">
            <SendHorizontal size={18} strokeWidth={2.2} />
          </button>
        </form>

        <p className="chat-note">
          Trợ lý trả lời tự động, có thể nhầm. Cần chắc chắn thì{' '}
          <a href={siteConfig.phoneHref}>gọi {siteConfig.phoneDisplay}</a>.
        </p>
      </div>
    </>
  );
}
