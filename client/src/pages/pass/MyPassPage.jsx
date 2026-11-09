import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { myPassApi, setPassStatusApi, deletePassApi } from "../../api/pass";
import PassCard from "../../components/PassCard";
import { PASS_STATUS_LABELS, MODERATION_LABELS, toOptions } from "../../utils/labels";
import { CardSkeletons, EmptyState } from "../../components/ListStates";
import Icon from "../../components/Icon";

export default function MyPassPage() {
  const [data, setData] = useState({ items: [], quota: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    myPassApi()
      .then((res) => active && setData(res))
      .catch((err) => active && setError(err.response?.data?.message || "Không thể kết nối máy chủ"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const act = async (fn) => {
    setError("");
    try {
      await fn();
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể kết nối máy chủ");
    }
  };

  const { items, quota } = data;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Bài Pass của tôi</h1>
          {quota && (
            <p className="text-sm text-muted">
              Đang đăng {quota.active}/{quota.limit} bài (gói {quota.plan})
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link to="/pass" className="btn btn-secondary">Xem tất cả bài</Link>
          <Link to="/pass/new" className="btn btn-primary"><Icon name="plus" size={18} />Đăng bài mới</Link>
        </div>
      </div>

      {error && <p className="alert-error">{error}</p>}
      {loading && <CardSkeletons />}
      {!loading && items.length === 0 && <EmptyState icon="package">Bạn chưa đăng bài nào.</EmptyState>}

      <div className={`stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-3 ${loading ? "hidden" : ""}`}>
        {items.map((item) => (
          <div key={item.id} className="space-y-2">
            <PassCard item={item} showFavorite={false} />
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full bg-subtle px-2.5 py-0.5">{MODERATION_LABELS[item.moderationStatus]}</span>
              {item.moderationNote && <span className="text-red-600 dark:text-red-300">Lý do: {item.moderationNote}</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={item.status}
                onChange={(e) => act(() => setPassStatusApi(item.id, e.target.value))}
                className="input !min-h-9 w-auto !py-1 text-sm"
              >
                {toOptions(PASS_STATUS_LABELS).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <Link to={`/pass/${item.id}/edit`} className="btn btn-secondary btn-sm">Sửa</Link>
              <button
                onClick={() => window.confirm("Xóa bài này? Hành động không thể hoàn tác.") && act(() => deletePassApi(item.id))}
                className="btn btn-sm border-red-200 bg-surface text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}