import { useState } from "react";
import { Link } from "react-router-dom";
import {
  sendRequestApi, cancelApi, acceptApi, rejectApi, disconnectApi, blockApi, unblockApi,
} from "../api/connections";

const btn = "rounded-lg px-4 py-2 font-medium disabled:opacity-60";
const primary = `${btn} bg-indigo-600 text-white hover:bg-indigo-700`;
const outline = `${btn} border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800`;

export default function ConnectPanel({ userId, relation, onChange }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const status = relation?.status || "none";
  const connectionId = relation?.connectionId;

  const run = async (action, next) => {
    setBusy(true);
    setError("");
    try {
      const data = await action();
      onChange(next(data));
      setMessage("");
    } catch (err) {
      setError(err.response?.data?.message || "Không thể kết nối máy chủ");
    } finally {
      setBusy(false);
    }
  };

  const handleBlock = () => {
    if (!window.confirm("Chặn người này? Hai bạn sẽ không thấy nhau trong gợi ý và không nhắn tin được.")) return;
    run(() => blockApi(userId), () => ({ status: "blocked_by_me", connectionId }));
  };

  return (
    <div className="space-y-3 rounded-2xl border border-gray-200 p-5 dark:border-gray-700">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">{error}</p>
      )}

      {status === "none" && (
        <>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={300}
            rows={2}
            placeholder="Lời nhắn làm quen (tùy chọn)"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-800"
          />
          <button
            disabled={busy}
            className={`${primary} w-full`}
            onClick={() => run(() => sendRequestApi(userId, message), (d) => ({ status: "sent", connectionId: d.connection.id }))}
          >
            {busy ? "Đang gửi..." : "Gửi yêu cầu kết nối"}
          </button>
        </>
      )}

      {status === "sent" && (
        <div className="flex items-center justify-between gap-3">
          <span>Đã gửi yêu cầu, đang chờ phản hồi</span>
          <button disabled={busy} className={outline}
            onClick={() => run(() => cancelApi(connectionId), () => ({ status: "none", connectionId }))}>
            Hủy yêu cầu
          </button>
        </div>
      )}

      {status === "received" && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>Người này muốn kết nối với bạn</span>
          <div className="flex gap-2">
            <button disabled={busy} className={primary}
              onClick={() => run(() => acceptApi(connectionId), () => ({ status: "accepted", connectionId }))}>
              Chấp nhận
            </button>
            <button disabled={busy} className={outline}
              onClick={() => run(() => rejectApi(connectionId), () => ({ status: "none", connectionId }))}>
              Từ chối
            </button>
          </div>
        </div>
      )}

      {status === "accepted" && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-green-600 dark:text-green-400">✓ Hai bạn đã kết nối</span>
          <div className="flex gap-2">
            <Link to={`/messages?user=${userId}`} className={primary}>Nhắn tin</Link>
            <button disabled={busy} className={outline}
              onClick={() => window.confirm("Hủy kết nối với người này?") &&
                run(() => disconnectApi(connectionId), () => ({ status: "none", connectionId }))}>
              Hủy kết nối
            </button>
          </div>
        </div>
      )}

      {status === "blocked_by_me" && (
        <div className="flex items-center justify-between gap-3">
          <span>Bạn đã chặn người này</span>
          <button disabled={busy} className={outline}
            onClick={() => run(() => unblockApi(userId), () => ({ status: "none", connectionId }))}>
            Bỏ chặn
          </button>
        </div>
      )}

      {status !== "blocked_by_me" && (
        <button disabled={busy} onClick={handleBlock} className="text-xs text-gray-500 hover:text-red-600 dark:text-gray-400">
          Chặn người dùng này
        </button>
      )}
    </div>
  );
}