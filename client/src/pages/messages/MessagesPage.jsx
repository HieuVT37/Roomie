import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { listConversationsApi, getMessagesApi, sendMessageApi } from "../../api/conversations";
import Avatar from "../../components/Avatar";
import Lightbox from "../../components/Lightbox";
import CountBadge from "../../components/CountBadge";
import { useNotifications } from "../../context/NotificationContext";

const POLL_MS = 4000;
const MAX_IMAGES = 4;
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const IMAGE_PREVIEW_TEXT = "📷 Đã gửi ảnh";

const timeLabel = (iso) =>
  new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

/* ---------- Ô soạn tin: nhập chữ + chọn ảnh ---------- */
// Được gắn key theo cuộc trò chuyện nên đổi cuộc trò chuyện là nội dung đang soạn tự được làm mới
function Composer({ onSend }) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]); // [{ file, preview }]
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const filesRef = useRef([]);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  // Rời khỏi cuộc trò chuyện thì giải phóng ảnh xem trước
  useEffect(() => {
    return () => filesRef.current.forEach((f) => URL.revokeObjectURL(f.preview));
  }, []);

  const handlePick = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = ""; // cho phép chọn lại cùng một file
    if (!picked.length) return;

    let message = "";
    const valid = [];
    for (const f of picked) {
      if (!ALLOWED_TYPES.includes(f.type)) message = "Chỉ chấp nhận ảnh JPG, PNG hoặc WebP";
      else if (f.size > MAX_SIZE) message = "Mỗi ảnh tối đa 5MB";
      else valid.push(f);
    }

    const room = MAX_IMAGES - files.length;
    if (valid.length > room) message = `Tối đa ${MAX_IMAGES} ảnh mỗi tin nhắn`;

    const accepted = valid.slice(0, room).map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setFiles((prev) => [...prev, ...accepted]);
    setError(message);
  };

  const removeFile = (preview) => {
    URL.revokeObjectURL(preview);
    setFiles((prev) => prev.filter((f) => f.preview !== preview));
  };

  const submit = async (e) => {
    e.preventDefault();
    const value = text.trim();
    if ((!value && files.length === 0) || sending) return;

    setSending(true);
    setError("");
    try {
      await onSend(value, files.map((f) => f.file));
      files.forEach((f) => URL.revokeObjectURL(f.preview));
      setFiles([]);
      setText("");
    } catch (err) {
      setError(err.response?.data?.message || "Không gửi được tin nhắn");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="border-t border-gray-200 dark:border-gray-700">
      {error && (
        <p className="mx-3 mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">{error}</p>
      )}

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 px-3 pt-3">
          {files.map((f) => (
            <div key={f.preview} className="relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <img src={f.preview} alt="" className="h-full w-full object-cover" />
              <button type="button" onClick={() => removeFile(f.preview)} aria-label="Bỏ ảnh này"
                className="absolute right-0 top-0 rounded-bl bg-black/70 px-1.5 text-xs text-white">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 p-3">
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handlePick} className="hidden" />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={files.length >= MAX_IMAGES || sending}
          title={`Đính kèm ảnh (tối đa ${MAX_IMAGES})`}
          className="rounded-lg border border-gray-300 px-3 py-2 hover:bg-gray-100 disabled:opacity-40 dark:border-gray-600 dark:hover:bg-gray-800"
        >
          🖼️
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          placeholder="Nhập tin nhắn..."
          className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-800"
        />
        <button
          type="submit"
          disabled={sending || (!text.trim() && files.length === 0)}
          className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {sending ? "Đang gửi..." : "Gửi"}
        </button>
      </div>
    </form>
  );
}

export default function MessagesPage() {
  const { user } = useAuth();
  const { conversationId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const wantedUser = params.get("user");

  const [convs, setConvs] = useState([]);
  const [convsLoaded, setConvsLoaded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [canSend, setCanSend] = useState(true);
  const [error, setError] = useState("");
  const [viewer, setViewer] = useState(null); // { images, index }
  const { refresh: refreshNotifications } = useNotifications();
  const lastRef = useRef(null);
  const listRef = useRef(null); // khung cuộn của tin nhắn
  const stickRef = useRef(true); // đang ở sát cuối khung chat thì mới tự cuộn theo tin mới
  const firstScrollRef = useRef(true);

  // Danh sách hội thoại (làm mới mỗi 10 giây để cập nhật tin chưa đọc)
  useEffect(() => {
    let active = true;
    const load = () =>
      listConversationsApi()
        .then((res) => {
          if (!active) return;
          setConvs(res.items);
          setConvsLoaded(true);
        })
        .catch(() => {});
    load();
    const timer = setInterval(load, 10000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  // /messages?user=<id> -> mở đúng cuộc trò chuyện với người đó
  useEffect(() => {
    if (conversationId || !wantedUser || !convsLoaded) return;
    const found = convs.find((c) => c.other.userId === wantedUser);
    if (found) navigate(`/messages/${found.id}`, { replace: true });
  }, [conversationId, wantedUser, convs, convsLoaded, navigate]);

  // Tải tin nhắn + polling
  useEffect(() => {
    if (!conversationId) return;
    let active = true;
    let initial = true;
    lastRef.current = null;
    setMessages([]);
    setError("");
    firstScrollRef.current = true;
    stickRef.current = true;

    const load = async () => {
      try {
        const data = await getMessagesApi(conversationId, initial ? null : lastRef.current);
        if (!active) return;
        setCanSend(data.canSend);
        if (initial) {
          setMessages(data.messages);
          initial = false;
          setConvs((list) => list.map((c) => (c.id === conversationId ? { ...c, unread: 0 } : c)));
          refreshNotifications();
        } else if (data.messages.length) {
          refreshNotifications();
          setMessages((prev) => {
            const seen = new Set(prev.map((m) => m._id));
            return [...prev, ...data.messages.filter((m) => !seen.has(m._id))];
          });
        }
        lastRef.current = data.messages.length
          ? data.messages[data.messages.length - 1].createdAt
          : lastRef.current || new Date(0).toISOString();
      } catch (err) {
        if (active && initial) setError(err.response?.data?.message || "Không tải được tin nhắn");
      }
    };

    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [conversationId, refreshNotifications]);

  // Chỉ cuộn bên trong khung chat (không cuộn cả trang nên không bị lộ phần footer)
  const scrollToBottom = (behavior) => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  };

  useEffect(() => {
    if (!messages.length) return;
    if (firstScrollRef.current) {
      scrollToBottom("auto"); // mở cuộc trò chuyện: nhảy thẳng tới tin mới nhất
      firstScrollRef.current = false;
    } else if (stickRef.current) {
      scrollToBottom("smooth");
    }
  }, [messages.length]);

  const handleListScroll = (e) => {
    const el = e.currentTarget;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  // Ảnh tải xong làm khung cao thêm: giữ nguyên vị trí cuối nếu đang ở cuối
  const handleImageLoad = () => {
    if (stickRef.current) scrollToBottom("auto");
  };

  // Gọi từ Composer: lỗi được ném ra để Composer tự hiển thị
  const send = async (text, files) => {
    const { message } = await sendMessageApi(conversationId, text, files);
    stickRef.current = true;
    setMessages((prev) => (prev.some((m) => m._id === message._id) ? prev : [...prev, message]));
    setConvs((list) =>
      list.map((c) =>
        c.id === conversationId
          ? { ...c, lastMessage: { text: message.text || IMAGE_PREVIEW_TEXT, senderId: message.senderId } }
          : c
      )
    );
  };

  const active = convs.find((c) => c.id === conversationId);

  return (
    <div className="mx-auto grid h-[70vh] max-w-6xl overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 md:grid-cols-[280px_1fr]">
      {/* Danh sách hội thoại */}
      <aside className="overflow-y-auto border-b border-gray-200 dark:border-gray-700 md:border-b-0 md:border-r">
        <h2 className="px-4 py-3 font-semibold">Tin nhắn</h2>
        {convsLoaded && convs.length === 0 && (
          <p className="px-4 text-sm text-gray-500 dark:text-gray-400">
            Chưa có cuộc trò chuyện nào. Hãy kết nối với ai đó trước.
          </p>
        )}
        {convs.map((c) => (
          <button
            key={c.id}
            onClick={() => navigate(`/messages/${c.id}`)}
            className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 ${c.id === conversationId ? "bg-indigo-50 dark:bg-gray-800" : ""}`}
          >
            <Avatar src={c.other.avatarUrl} name={c.other.displayName} size={40} />
            <div className="min-w-0 flex-1">
              <p className={`truncate ${c.unread > 0 ? "font-bold" : "font-medium"}`}>{c.other.displayName}</p>
              <p className={`truncate text-xs ${c.unread > 0 ? "font-semibold text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"}`}>
                {c.lastMessage?.text || "Chưa có tin nhắn"}
              </p>
            </div>
            <CountBadge count={c.unread} inline />
          </button>
        ))}
      </aside>

      {/* Khung chat */}
      <section className="flex min-h-0 flex-col">
        {!conversationId ? (
          <div className="flex flex-1 items-center justify-center text-gray-500 dark:text-gray-400">
            Chọn một cuộc trò chuyện để bắt đầu
          </div>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              {active && <Avatar src={active.other.avatarUrl} name={active.other.displayName} size={36} />}
              <h2 className="font-semibold">{active?.other.displayName || "Cuộc trò chuyện"}</h2>
            </header>

            <div ref={listRef} onScroll={handleListScroll} className="flex-1 space-y-2 overflow-y-auto p-4">
              {messages.map((m) => {
                const mine = m.senderId === user.id;
                const hasImages = m.images?.length > 0;
                return (
                  <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 ${mine
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 dark:bg-gray-800"}`}
                    >
                      {hasImages && (
                        <div className={`mb-1 grid w-56 gap-1 sm:w-64 ${m.images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                          {m.images.map((url, i) => (
                            <button
                              type="button"
                              key={url}
                              onClick={() => setViewer({ images: m.images, index: i })}
                              className="overflow-hidden rounded-lg"
                            >
                              <img
                                src={url}
                                alt="Ảnh đã gửi"
                                loading="lazy"
                                onLoad={handleImageLoad}
                                className={`w-full object-cover ${m.images.length > 1 ? "aspect-square" : "max-h-72"}`}
                              />
                            </button>
                          ))}
                        </div>
                      )}
                      {m.text && <p className="whitespace-pre-wrap break-words">{m.text}</p>}
                      <p className={`mt-1 text-right text-[10px] ${mine ? "text-indigo-200" : "text-gray-500"}`}>
                        {timeLabel(m.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {error && (
              <p className="mx-4 mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">{error}</p>
            )}

            {canSend ? (
              <Composer key={conversationId} onSend={send} />
            ) : (
              <p className="border-t border-gray-200 p-3 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                Kết nối đã bị hủy nên không thể nhắn tin tiếp.
              </p>
            )}
          </>
        )}
      </section>

      {viewer && (
        <Lightbox
          images={viewer.images}
          index={viewer.index}
          onClose={() => setViewer(null)}
          onChange={(i) => setViewer((v) => ({ ...v, index: i }))}
        />
      )}
    </div>
  );
}