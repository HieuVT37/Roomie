import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  listConversationsApi,
  getMessagesApi,
  sendMessageApi,
} from "../../api/conversations";
import Avatar from "../../components/Avatar";
import Lightbox from "../../components/Lightbox";
import CountBadge from "../../components/CountBadge";
import { useNotifications } from "../../context/notificationStore";
import { slideIn } from "../../hooks/useMotion";
import Icon from "../../components/Icon";
import { IMAGE_ACCEPT, checkImageFile } from "../../utils/imageFiles";

const POLL_MS = 4000;
const MAX_IMAGES = 4;
const IMAGE_PREVIEW_TEXT = "📷 Đã gửi ảnh";

const timeLabel = (iso) =>
  new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

// Nhận biết màn hình điện thoại (< md của Tailwind)
function useIsMobile() {
  const query = "(max-width: 767px)";
  const [mobile, setMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return mobile;
}

// Chiều cao vùng nhìn thấy thật sự (đã trừ bàn phím) để khung chat luôn sát bàn phím
function useVisualViewport(enabled) {
  const [vv, setVv] = useState({ height: window.innerHeight, top: 0 });
  useEffect(() => {
    if (!enabled) return;
    const v = window.visualViewport;
    const update = () =>
      setVv(
        v
          ? { height: v.height, top: v.offsetTop }
          : { height: window.innerHeight, top: 0 },
      );
    update();
    if (!v) {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }
    v.addEventListener("resize", update);
    v.addEventListener("scroll", update);
    return () => {
      v.removeEventListener("resize", update);
      v.removeEventListener("scroll", update);
    };
  }, [enabled]);
  return vv;
}

/* ---------- Ô soạn tin: nhập chữ + chọn ảnh ---------- */
// Được gắn key theo cuộc trò chuyện nên đổi cuộc trò chuyện là nội dung đang soạn tự được làm mới
function Composer({ onSend, onFocus }) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]); // [{ file, preview }]
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const textRef = useRef(null);
  const filesRef = useRef([]);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  // Rời khỏi cuộc trò chuyện thì giải phóng ảnh xem trước
  useEffect(() => {
    return () =>
      filesRef.current.forEach((f) => URL.revokeObjectURL(f.preview));
  }, []);

  const handlePick = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = ""; // cho phép chọn lại cùng một file
    if (!picked.length) return;

    let message = "";
    const valid = [];
    for (const f of picked) {
      const err = checkImageFile(f);
      if (err) message = err;
      else valid.push(f);
    }

    const room = MAX_IMAGES - files.length;
    if (valid.length > room) message = `Tối đa ${MAX_IMAGES} ảnh mỗi tin nhắn`;

    const accepted = valid
      .slice(0, room)
      .map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setFiles((prev) => [...prev, ...accepted]);
    setError(message);
  };

  const removeFile = (preview) => {
    URL.revokeObjectURL(preview);
    setFiles((prev) => prev.filter((f) => f.preview !== preview));
  };

  const submit = async (e) => {
    e?.preventDefault();
    const value = text.trim();
    if ((!value && files.length === 0) || sending) return;

    textRef.current?.focus(); // giữ bàn phím ngay lúc bấm gửi
    setSending(true);
    setError("");
    try {
      await onSend(
        value,
        files.map((f) => f.file),
      );
      files.forEach((f) => URL.revokeObjectURL(f.preview));
      setFiles([]);
      setText("");
    } catch (err) {
      setError(err.response?.data?.message || "Không gửi được tin nhắn");
    } finally {
      setSending(false);
      textRef.current?.focus(); // vẫn giữ bàn phím sau khi gửi xong
    }
  };

  return (
    // Dùng div thay cho form để iOS không coi đây là biểu mẫu (bớt thanh mũi tên lên/xuống)
    <div
      data-composer
      className="border-t border-line bg-surface"
    >
      {error && (
        <p className="mx-3 mt-3 alert-error">
          {error}
        </p>
      )}

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 px-3 pt-3">
          {files.map((f) => (
            <div
              key={f.preview}
              className="relative h-16 w-16 overflow-hidden rounded-xl border border-line"
            >
              <img
                src={f.preview}
                alt=""
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeFile(f.preview)}
                aria-label="Bỏ ảnh này"
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900/75 text-white"
              >
                <Icon name="plus" size={13} className="rotate-45" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 p-3">
        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_ACCEPT}
          multiple
          onChange={handlePick}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={files.length >= MAX_IMAGES || sending}
          title={`Đính kèm ảnh (tối đa ${MAX_IMAGES})`}
          aria-label="Đính kèm ảnh"
          className="btn btn-ghost h-11 w-11 shrink-0 !rounded-full !p-0"
        >
          <Icon name="image" size={20} />
        </button>
        <input
          ref={textRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={onFocus}
          onKeyDown={(e) => {
            // Enter để gửi (bỏ qua khi đang gõ dấu tiếng Việt bằng IME)
            if (e.key === "Enter" && !e.nativeEvent.isComposing) submit(e);
          }}
          autoComplete="off"
          name="chat-message"
          maxLength={2000}
          placeholder="Nhập tin nhắn..."
          enterKeyHint="send"
          className="input flex-1 !rounded-full"
        />
        <button
          type="button"
          onClick={submit}
          onMouseDown={(e) => e.preventDefault()} // không cho nút cướp focus của input
          disabled={sending || (!text.trim() && files.length === 0)}
          aria-label="Gửi"
          className="btn btn-primary h-11 shrink-0 !rounded-full px-4"
        >
          <Icon name="send" size={17} />
          <span className="max-sm:hidden">{sending ? "Đang gửi..." : "Gửi"}</span>
        </button>
      </div>
    </div>
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
  const seenIdsRef = useRef({ conversation: null, ids: new Set() }); // tin đã hiển thị (để chỉ tin mới trượt lên)

  const isMobile = useIsMobile();
  const mobileChat = isMobile && !!conversationId; // điện thoại + đang mở một cuộc trò chuyện
  const vv = useVisualViewport(mobileChat);

  // Khoá cuộn trang phía sau khi chat toàn màn hình trên điện thoại
  useEffect(() => {
    if (!mobileChat) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileChat]);

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

  // Đổi cuộc trò chuyện: xóa tin nhắn và lỗi cũ ngay trong lúc render (cách React khuyến nghị, thay vì setState trong effect)
  const [shownConversation, setShownConversation] = useState(conversationId);
  if (shownConversation !== conversationId) {
    setShownConversation(conversationId);
    setMessages([]);
    setError("");
  }

  // Tải tin nhắn + polling
  useEffect(() => {
    if (!conversationId) return;
    let active = true;
    let initial = true;
    lastRef.current = null;
    firstScrollRef.current = true;
    stickRef.current = true;

    const load = async () => {
      try {
        const data = await getMessagesApi(
          conversationId,
          initial ? null : lastRef.current,
        );
        if (!active) return;
        setCanSend(data.canSend);
        if (initial) {
          setMessages(data.messages);
          initial = false;
          setConvs((list) =>
            list.map((c) =>
              c.id === conversationId ? { ...c, unread: 0 } : c,
            ),
          );
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
        if (active && initial)
          setError(err.response?.data?.message || "Không tải được tin nhắn");
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

  // Đưa khung tin nhắn về đúng vị trí sau khi bố cục đổi (bàn phím bật/tắt, mở chat, ảnh tải xong).
  // iOS không tự "kẹp" lại vị trí cuộn khi khung cao thêm nên sẽ để lại khoảng trống, ở đây ép lại bằng tay.
  const timersRef = useRef([]);
  const settleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const max = Math.max(0, el.scrollHeight - el.clientHeight);
    if (stickRef.current) el.scrollTop = max;
    else if (el.scrollTop > max) el.scrollTop = max;
  }, []);
  const scheduleSettle = useCallback(
    (delays = [0, 100, 300, 600]) => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = delays.map((ms) => setTimeout(settleScroll, ms));
    },
    [settleScroll],
  );
  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  useEffect(() => {
    if (!messages.length) return;
    if (firstScrollRef.current) {
      // mở cuộc trò chuyện: nhảy thẳng tới tin mới nhất, cuộn lại vài lần phòng khi bố cục còn đổi
      firstScrollRef.current = false;
      stickRef.current = true;
      scrollToBottom("auto");
      scheduleSettle();
    } else if (stickRef.current) {
      scrollToBottom("smooth");
    }
  }, [messages.length, scheduleSettle]);

  const handleListScroll = (e) => {
    const el = e.currentTarget;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  // Ảnh tải xong làm khung cao thêm: giữ nguyên vị trí cuối nếu đang ở cuối
  const handleImageLoad = () => {
    if (stickRef.current) scrollToBottom("auto");
  };

  // Bàn phím bật/tắt làm khung đổi chiều cao: giữ tin mới nhất ở cuối
  useEffect(() => {
    if (mobileChat) scheduleSettle();
  }, [vv.height, vv.top, mobileChat, scheduleSettle]);

  // Ô nhập được chạm: coi như muốn xem tin mới nhất
  const handleComposerFocus = () => {
    stickRef.current = true;
    scheduleSettle([100, 300, 600]);
  };

  // Bàn phím vừa ẩn: kéo trang về đầu và dọn khoảng trống
  const handleSectionBlur = () => {
    if (!mobileChat) return;
    setTimeout(() => {
      window.scrollTo(0, 0);
      scheduleSettle();
    }, 50);
  };

  // Gọi từ Composer: lỗi được ném ra để Composer tự hiển thị
  const send = async (text, files) => {
    const { message } = await sendMessageApi(conversationId, text, files);
    stickRef.current = true;
    setMessages((prev) =>
      prev.some((m) => m._id === message._id) ? prev : [...prev, message],
    );
    setConvs((list) =>
      list.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              lastMessage: {
                text: message.text || IMAGE_PREVIEW_TEXT,
                senderId: message.senderId,
              },
            }
          : c,
      ),
    );
  };

  // Chạm ra ngoài ô soạn tin thì ẩn bàn phím
  const dismissKeyboard = (e) => {
    if (e.target.closest("[data-composer]")) return;
    const el = document.activeElement;
    if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) el.blur();
  };

  const active = convs.find((c) => c.id === conversationId);


  // Tin mới đến hoặc vừa gửi trượt lên từ dưới; lượt tải đầu của mỗi cuộc trò chuyện hiện ngay
  useLayoutEffect(() => {
    const seen = seenIdsRef.current;
    if (seen.conversation !== conversationId) {
      seen.conversation = conversationId;
      seen.ids = new Set();
    }
    const firstBatch = seen.ids.size === 0;
    listRef.current?.querySelectorAll("[data-msg-id]").forEach((el) => {
      const id = el.dataset.msgId;
      if (seen.ids.has(id)) return;
      seen.ids.add(id);
      if (!firstBatch) slideIn(el, { y: 16, duration: 320 });
    });
  }, [messages, conversationId]);
  return (
    <div
      style={mobileChat ? { top: vv.top, height: vv.height } : undefined}
      className={
        mobileChat
          ? "fixed inset-x-0 z-50 flex flex-col overflow-hidden bg-surface"
          : "card grid h-[calc(100svh-12rem)] min-h-[32rem] overflow-hidden shadow-[var(--shadow-soft)] md:grid-cols-[19rem_1fr]"
      }
    >
      {/* Danh sách hội thoại: trên điện thoại sẽ ẩn khi đã mở một cuộc trò chuyện */}
      <aside
        className={`overflow-y-auto border-b border-line bg-surface md:border-b-0 md:border-r ${
          conversationId ? "hidden md:block" : ""
        }`}
      >
        <h2 className="px-5 pb-2 pt-5 text-lg font-semibold">Tin nhắn</h2>
        {convsLoaded && convs.length === 0 && (
          <p className="px-4 text-sm text-muted">
            Chưa có cuộc trò chuyện nào. Hãy kết nối với ai đó trước.
          </p>
        )}
        {convs.map((c) => (
          <button
            key={c.id}
            onClick={() => navigate(`/messages/${c.id}`)}
            className={`relative flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-subtle ${c.id === conversationId ? "bg-subtle before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-r-full before:bg-brand" : ""}`}
          >
            <Avatar
              src={c.other.avatarUrl}
              name={c.other.displayName}
              size={40}
            />
            <div className="min-w-0 flex-1">
              <p
                className={`truncate ${c.unread > 0 ? "font-bold" : "font-medium"}`}
              >
                {c.other.displayName}
              </p>
              <p
                className={`truncate text-xs ${c.unread > 0 ? "font-semibold text-ink" : "text-muted"}`}
              >
                {c.lastMessage?.text || "Chưa có tin nhắn"}
              </p>
            </div>
            <CountBadge count={c.unread} inline />
          </button>
        ))}
      </aside>

      {/* Khung chat */}
      <section
        onClick={dismissKeyboard}
        onBlur={handleSectionBlur}
        className={`min-h-0 flex-col ${
          mobileChat ? "flex flex-1" : conversationId ? "flex" : "hidden md:flex"
        }`}
      >
        {!conversationId ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-canvas/40 text-muted">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-subtle text-brand"><Icon name="message" size={24} /></span>
            Chọn một cuộc trò chuyện để bắt đầu
          </div>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3">
              <button
                type="button"
                onClick={() => navigate("/messages")}
                aria-label="Quay lại danh sách"
                className="btn btn-ghost -ml-1 h-10 w-10 !p-0 md:hidden"
              >
                <Icon name="chevronLeft" size={20} />
              </button>
              {active && (
                <Avatar
                  src={active.other.avatarUrl}
                  name={active.other.displayName}
                  size={36}
                  zoomable
                />
              )}
              <h2 className="font-semibold">
                {active?.other.displayName || "Cuộc trò chuyện"}
              </h2>
            </header>

            <div
              ref={listRef}
              onScroll={handleListScroll}
              className="flex-1 space-y-2 overflow-y-auto bg-canvas/40 p-4 sm:p-5"
            >
              {messages.map((m) => {
                const mine = m.senderId === user.id;
                const hasImages = m.images?.length > 0;
                return (
                  <div
                    key={m._id}
                    data-msg-id={m._id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2 shadow-[var(--shadow-soft)] ${
                        mine
                          ? "rounded-br-md bg-btn text-btn-ink"
                          : "rounded-bl-md bg-surface"
                      }`}
                    >
                      {hasImages && (
                        <div
                          className={`mb-1 grid w-56 gap-1 sm:w-64 ${m.images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
                        >
                          {m.images.map((url, i) => (
                            <button
                              type="button"
                              key={url}
                              onClick={() =>
                                setViewer({ images: m.images, index: i })
                              }
                              className="overflow-hidden rounded-xl"
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
                      {m.text && (
                        <p className="whitespace-pre-wrap break-words">
                          {m.text}
                        </p>
                      )}
                      <p
                        className={`mt-1 text-right text-[10px] tabular-nums ${mine ? "opacity-75" : "text-muted"}`}
                      >
                        {timeLabel(m.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {error && (
              <p className="mx-4 mb-2 alert-error">
                {error}
              </p>
            )}

            {canSend ? (
              <Composer
                key={conversationId}
                onSend={send}
                onFocus={handleComposerFocus}
              />
            ) : (
              <p className="border-t border-line p-3 text-center text-sm text-muted">
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
