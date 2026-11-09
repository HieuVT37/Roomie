import { useEffect, useRef, useState } from "react";
import { chatAiApi } from "../api/ai";
import Icon from "./Icon";

// =====================================================================
// Roomie AI: nút tròn ở góc phải dưới, bấm vào mở hộp chat với trợ lý Gemini.
// Lịch sử hội thoại giữ trong sessionStorage (giữ khi chuyển trang, mất khi đóng tab).
// =====================================================================

const STORE = "roomie:ai-chat";
const GREETING = {
  role: "assistant",
  text: "Chào bạn, mình là **Roomie AI**. Mình có thể giúp bạn tìm phòng, ghép bạn cùng phòng, pass đồ hoặc giải đáp cách dùng Roomie. Bạn cần gì nào?",
};
const SUGGESTIONS = [
  "Làm sao để tìm bạn cùng phòng hợp với mình?",
  "Gói Plus và Pro khác gì nhau?",
  "Mẹo an toàn khi đặt cọc phòng trọ",
  "Cách đăng bài pass đồ",
];

const loadHistory = () => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORE));
    if (Array.isArray(saved) && saved.length) return saved;
  } catch {
    // sessionStorage bị chặn hoặc dữ liệu hỏng: bắt đầu hội thoại mới
  }
  return [GREETING];
};

// Hiển thị câu trả lời có **chữ đậm**, gạch đầu dòng và danh sách số — dựng phần tử React, không chèn HTML thô
function renderInline(text, keyPrefix) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>
      : <span key={`${keyPrefix}-${i}`}>{part}</span>,
  );
}
function RichText({ text }) {
  const blocks = [];
  let list = null;
  text.split("\n").forEach((raw, i) => {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (bullet) {
      if (!list) {
        list = { ordered: /^\s*\d/.test(line), items: [] };
        blocks.push(list);
      }
      list.items.push(renderInline(bullet[1], `li${i}`));
      return;
    }
    list = null;
    if (line.trim()) blocks.push(<p key={`p${i}`}>{renderInline(line, `p${i}`)}</p>);
  });
  return (
    <div className="space-y-1.5">
      {blocks.map((b, i) =>
        b.items ? (
          b.ordered
            ? <ol key={`l${i}`} className="list-decimal space-y-1 pl-5">{b.items.map((it, j) => <li key={j}>{it}</li>)}</ol>
            : <ul key={`l${i}`} className="list-disc space-y-1 pl-5">{b.items.map((it, j) => <li key={j}>{it}</li>)}</ul>
        ) : b,
      )}
    </div>
  );
}

function AiAvatar({ size = 32 }) {
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <img src="/roomie-logo.svg" alt="" width={size} height={size} className="rounded-full" />
      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface bg-emerald-400" aria-hidden="true" />
    </span>
  );
}

export default function AiChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(loadHistory);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef(null);
  const inputRef = useRef(null);

  // Lưu lịch sử, tự cuộn xuống tin mới nhất
  useEffect(() => {
    try {
      sessionStorage.setItem(STORE, JSON.stringify(messages.slice(-30)));
    } catch {
      // không lưu được thì thôi, hội thoại vẫn dùng bình thường
    }
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, sending, open]);

  // Mở hộp chat thì đặt con trỏ vào ô nhập; Esc để đóng
  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(() => inputRef.current?.focus(), 250);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const send = async (content) => {
    const q = content.trim();
    if (!q || sending) return;
    const next = [...messages, { role: "user", text: q }];
    setMessages(next);
    setText("");
    setError("");
    setSending(true);
    try {
      // Không gửi câu chào mở đầu (chỉ hiển thị phía client)
      const history = next.filter((m) => m !== GREETING && !(m.role === "assistant" && m.text === GREETING.text));
      const { reply } = await chatAiApi(history.slice(-12));
      setMessages((list) => [...list, { role: "assistant", text: reply }]);
    } catch (err) {
      setError(err.response?.data?.message || "Trợ lý AI tạm thời không phản hồi, bạn thử lại nhé");
    } finally {
      setSending(false);
    }
  };

  const retry = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    setMessages((list) => list.slice(0, list.lastIndexOf(lastUser)));
    send(lastUser.text);
  };

  const reset = () => {
    setMessages([GREETING]);
    setError("");
  };

  const onlyGreeting = messages.length === 1;

  return (
    <div className="ai-chat">
      {open && (
        <section className="ai-panel card" role="dialog" aria-label="Trò chuyện với Roomie AI">
          {/* Đầu hộp chat */}
          <header className="flex items-center gap-3 border-b border-line px-4 py-3">
            <AiAvatar size={36} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-tight">Roomie AI</p>
              <p className="text-xs text-muted">Trợ lý tìm bạn cùng phòng</p>
            </div>
            <button type="button" onClick={reset} title="Cuộc trò chuyện mới" aria-label="Cuộc trò chuyện mới"
              className="btn btn-ghost h-9 w-9 !p-0">
              <Icon name="edit" size={17} />
            </button>
            <button type="button" onClick={() => setOpen(false)} aria-label="Đóng hộp chat"
              className="btn btn-ghost h-9 w-9 !p-0">
              <Icon name="plus" size={20} className="rotate-45" />
            </button>
          </header>

          {/* Tin nhắn */}
          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {messages.map((m, i) =>
              m.role === "assistant" ? (
                <div key={i} className="ai-msg flex items-end gap-2">
                  <AiAvatar size={26} />
                  <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-subtle px-3.5 py-2.5 text-sm leading-6">
                    <RichText text={m.text} />
                  </div>
                </div>
              ) : (
                <div key={i} className="ai-msg flex justify-end">
                  <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-btn px-3.5 py-2.5 text-sm leading-6 text-btn-ink">
                    {m.text}
                  </p>
                </div>
              ),
            )}

            {/* Gợi ý câu hỏi khi mới mở */}
            {onlyGreeting && !sending && (
              <div className="flex flex-wrap gap-2 pl-8">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)} className="chip !min-h-0 !py-1.5 text-left text-xs">
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Đang soạn trả lời */}
            {sending && (
              <div className="ai-msg flex items-end gap-2" aria-label="Roomie AI đang trả lời">
                <AiAvatar size={26} />
                <div className="ai-typing rounded-2xl rounded-bl-md bg-subtle px-4 py-3">
                  <span /><span /><span />
                </div>
              </div>
            )}

            {error && (
              <div className="alert-error flex items-center justify-between gap-3">
                <span>{error}</span>
                <button type="button" onClick={retry} className="shrink-0 font-semibold underline underline-offset-4">Thử lại</button>
              </div>
            )}
          </div>

          {/* Ô nhập */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(text);
            }}
            className="flex items-end gap-2 border-t border-line p-3"
          >
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                // Enter để gửi, Shift+Enter xuống dòng (bỏ qua khi đang gõ dấu tiếng Việt)
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  send(text);
                }
              }}
              rows={1}
              maxLength={1000}
              placeholder="Hỏi Roomie AI..."
              aria-label="Nội dung câu hỏi"
              className="input max-h-28 min-h-11 flex-1 resize-none !rounded-2xl py-2.5"
            />
            <button type="submit" disabled={sending || !text.trim()} aria-label="Gửi"
              className="btn btn-primary h-11 w-11 shrink-0 !rounded-full !p-0">
              <Icon name="send" size={18} />
            </button>
          </form>
        </section>
      )}

      {/* Nút tròn mở / đóng */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Đóng Roomie AI" : "Mở trò chuyện với Roomie AI"}
        className={`ai-fab ${open ? "is-open" : ""}`}
      >
        <span className="ai-fab-icon">
          {open ? <Icon name="chevronRight" size={24} className="rotate-90" /> : <img src="/roomie-logo.svg" alt="" width="34" height="34" className="rounded-full" />}
        </span>
        {!open && <span className="ai-fab-badge">AI</span>}
      </button>
    </div>
  );
}
