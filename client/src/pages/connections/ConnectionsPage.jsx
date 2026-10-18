import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  listConnectionsApi, connectionSummaryApi, acceptApi, rejectApi, cancelApi, disconnectApi, unblockApi,
} from "../../api/connections";
import Avatar from "../../components/Avatar";
import ScoreBadge from "../../components/ScoreBadge";

const TABS = [
  { key: "received", label: "Nhận được", count: "receivedPending" },
  { key: "sent", label: "Đã gửi", count: "sentPending" },
  { key: "accepted", label: "Đã kết nối", count: "accepted" },
  { key: "blocked", label: "Đã chặn" },
];

const btn = "rounded-lg px-3 py-1.5 text-sm font-medium";
const primary = `${btn} bg-indigo-600 text-white hover:bg-indigo-700`;
const outline = `${btn} border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800`;

const EMPTY = {
  received: "Chưa có yêu cầu kết nối nào gửi đến bạn.",
  sent: "Bạn chưa gửi yêu cầu nào đang chờ phản hồi.",
  accepted: "Bạn chưa có kết nối nào. Hãy xem gợi ý Matching để bắt đầu.",
  blocked: "Bạn chưa chặn ai.",
};

export default function ConnectionsPage() {
  const [tab, setTab] = useState("received");
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([listConnectionsApi(tab), connectionSummaryApi()])
      .then(([list, sum]) => {
        if (!active) return;
        setItems(list.items);
        setSummary(sum);
      })
      .catch((err) => active && setError(err.response?.data?.message || "Không thể kết nối máy chủ"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [tab, reloadKey]);

  const act = async (fn) => {
    setError("");
    try {
      await fn();
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể kết nối máy chủ");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kết nối</h1>
        {summary && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Đã dùng {summary.requestsUsed}/{summary.requestsLimit} yêu cầu kết nối trong tháng này (gói {summary.plan})
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm ${tab === t.key
              ? "border-indigo-600 font-semibold text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"}`}
          >
            {t.label}
            {summary && t.count && summary[t.count] > 0 && (
              <span className="ml-1 rounded-full bg-indigo-100 px-2 text-xs text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
                {summary[t.count]}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">{error}</p>}
      {loading && <p>Đang tải...</p>}
      {!loading && items.length === 0 && <p className="text-gray-500 dark:text-gray-400">{EMPTY[tab]}</p>}

      <ul className="space-y-3">
        {items.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
            <Avatar src={c.user.avatarUrl} name={c.user.displayName} />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link to={`/matching/${c.user.userId}`} className="font-semibold hover:underline">
                  {c.user.displayName}
                </Link>
                {c.matchScore !== null && c.matchScore !== undefined && <ScoreBadge score={c.matchScore} />}
              </div>
              {c.message && <p className="text-sm text-gray-600 dark:text-gray-300">“{c.message}”</p>}
            </div>

            <div className="flex gap-2">
              {tab === "received" && (
                <>
                  <button className={primary} onClick={() => act(() => acceptApi(c.id))}>Chấp nhận</button>
                  <button className={outline} onClick={() => act(() => rejectApi(c.id))}>Từ chối</button>
                </>
              )}
              {tab === "sent" && (
                <button className={outline} onClick={() => act(() => cancelApi(c.id))}>Hủy yêu cầu</button>
              )}
              {tab === "accepted" && (
                <>
                  <Link to={`/messages?user=${c.user.userId}`} className={primary}>Nhắn tin</Link>
                  <button className={outline}
                    onClick={() => window.confirm("Hủy kết nối với người này?") && act(() => disconnectApi(c.id))}>
                    Hủy kết nối
                  </button>
                </>
              )}
              {tab === "blocked" && (
                <button className={outline} onClick={() => act(() => unblockApi(c.user.userId))}>Bỏ chặn</button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}