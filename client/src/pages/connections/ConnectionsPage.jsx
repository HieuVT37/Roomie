import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  listConnectionsApi, connectionSummaryApi, markSeenApi, acceptApi, rejectApi, cancelApi, disconnectApi, unblockApi,
} from "../../api/connections";
import { useNotifications } from "../../context/notificationStore";
import RedDot from "../../components/RedDot";
import Avatar from "../../components/Avatar";
import ScoreBadge from "../../components/ScoreBadge";
import { EmptyState } from "../../components/ListStates";
import useRequestStatus from "../../hooks/useRequestStatus";
import { useTabDirection, useTabIndicator } from "../../hooks/useMotion";
import { confettiFrom } from "../../components/fx/confetti";
import { toast } from "../../components/fx/Toaster";

const TABS = [
  { key: "received", label: "Nhận được", count: "receivedPending", dot: "received" },
  { key: "sent", label: "Đã gửi", count: "sentPending", dot: "sent" },
  { key: "accepted", label: "Đã kết nối", count: "accepted", dot: "accepted" },
  { key: "blocked", label: "Đã chặn" },
];

const btn = "btn btn-sm";
const primary = `${btn} btn-primary`;
const outline = `${btn} btn-secondary`;

const EMPTY = {
  received: "Chưa có yêu cầu kết nối nào gửi đến bạn.",
  sent: "Bạn chưa gửi yêu cầu nào đang chờ phản hồi.",
  accepted: "Bạn chưa có kết nối nào. Hãy xem gợi ý Matching để bắt đầu.",
  blocked: "Bạn chưa chặn ai.",
};

export default function ConnectionsPage() {
  const tabsRef = useRef(null);
  const [tab, setTab] = useState("received");
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const { refresh: refreshNotifications } = useNotifications();

  // Đang tải/lỗi suy ra từ khóa yêu cầu (không setState đồng bộ trong effect)
  const { loading, error, finish, setError } = useRequestStatus(JSON.stringify([tab, reloadKey]));

  useEffect(() => {
    let active = true;
    Promise.all([listConnectionsApi(tab), connectionSummaryApi()])
      .then(([list, sum]) => {
        if (!active) return;
        setItems(list.items);
        setSummary(sum);
        finish();
        // Đã mở tab này thì xóa chấm đỏ của tab (các mục mới vẫn được đánh dấu "Mới" trong lần hiển thị này)
        if (list.items.some((c) => c.unseen)) {
          markSeenApi(tab)
            .then(() => {
              if (!active) return;
              setSummary((s) => (s ? { ...s, unseen: { ...s.unseen, [tab]: 0 } } : s));
              refreshNotifications();
            })
            .catch(() => {});
        }
      })
      .catch((err) => active && finish(err.response?.data?.message || "Không thể kết nối máy chủ"));
    return () => {
      active = false;
    };
  }, [tab, reloadKey, refreshNotifications, finish]);

  const act = async (fn, onSuccess) => {
    setError("");
    try {
      await fn();
      onSuccess?.();
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể kết nối máy chủ");
    }
  };


  // Gạch chân trượt theo tab, nội dung trượt ngang theo hướng tab được chọn
  const tabIndex = TABS.findIndex((t) => t.key === tab);
  useTabIndicator(tabsRef, tabIndex);
  const tabDir = useTabDirection(tabIndex);
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Kết nối</h1>
        {summary && (
          <p className="text-sm text-muted">
            Đã dùng {summary.requestsUsed}/{summary.requestsLimit} yêu cầu kết nối trong tháng này (gói {summary.plan})
          </p>
        )}
      </div>

      <div ref={tabsRef} role="tablist" className="tablist flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            role="tab"
            aria-selected={tab === t.key}
            className="tab whitespace-nowrap"
          >
            {t.label}
            {summary?.unseen?.[t.dot] > 0 && <RedDot className="ml-1 align-middle" />}
            {summary && t.count && summary[t.count] > 0 && (
              <span className="ml-1.5 rounded-full bg-subtle px-2 text-xs font-semibold tabular-nums text-indigo-700 dark:text-brand">
                {summary[t.count]}
              </span>
            )}
          </button>
        ))}
        <span aria-hidden="true" className="tab-indicator" />
      </div>

      {error && <p className="alert-error">{error}</p>}
      {loading && <div className="skeleton h-40" aria-busy="true" aria-label="Đang tải" />}
      {!loading && items.length === 0 && <EmptyState icon="users">{EMPTY[tab]}</EmptyState>}

      <ul data-dir={tabDir} className="stagger space-y-3">
        {items.map((c) => (
          <li key={c.id} className="card flex flex-wrap items-center gap-4 p-4 transition-shadow hover:shadow-[var(--shadow-soft)] sm:p-5">
            <Avatar src={c.user.avatarUrl} name={c.user.displayName} />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link to={`/matching/${c.user.userId}`} className="font-semibold underline-offset-4 hover:text-brand hover:underline">
                  {c.user.displayName}
                </Link>
                {c.matchScore !== null && c.matchScore !== undefined && <ScoreBadge score={c.matchScore} />}
                {c.unseen && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-950 dark:text-red-300">
                    <RedDot className="!h-1.5 !w-1.5" /> Mới
                  </span>
                )}
                {tab === "sent" && c.status === "rejected" && (
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-muted dark:bg-gray-700">Đã bị từ chối</span>
                )}
                {tab === "accepted" && c.unseen && (
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Đã chấp nhận kết nối của bạn</span>
                )}
              </div>
              {c.message && <p className="text-sm text-muted">“{c.message}”</p>}
            </div>

            <div className="flex flex-wrap gap-2">
              {tab === "received" && (
                <>
                  <button
                    className={primary}
                    onClick={(e) => {
                      const btn = e.currentTarget;
                      act(() => acceptApi(c.id), () => {
                        confettiFrom(btn);
                        toast(`Đã kết nối với ${c.user.displayName}`);
                      });
                    }}
                  >
                    Chấp nhận
                  </button>
                  <button className={outline} onClick={() => act(() => rejectApi(c.id))}>Từ chối</button>
                </>
              )}
              {tab === "sent" && c.status === "pending" && (
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