import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { myPassApi, setPassStatusApi, deletePassApi } from "../../api/pass";
import PassCard from "../../components/PassCard";
import { PASS_STATUS_LABELS, MODERATION_LABELS, toOptions } from "../../utils/labels";

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
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Bài Pass của tôi</h1>
          {quota && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Đang đăng {quota.active}/{quota.limit} bài (gói {quota.plan})
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link to="/pass" className="rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600">Xem tất cả bài</Link>
          <Link to="/pass/new" className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">+ Đăng bài mới</Link>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">{error}</p>}
      {loading && <p>Đang tải...</p>}
      {!loading && items.length === 0 && <p>Bạn chưa đăng bài nào.</p>}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="space-y-2">
            <PassCard item={item} showFavorite={false} />
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full bg-gray-100 px-2 py-0.5 dark:bg-gray-800">{MODERATION_LABELS[item.moderationStatus]}</span>
              {item.moderationNote && <span className="text-red-600 dark:text-red-300">Lý do: {item.moderationNote}</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={item.status}
                onChange={(e) => act(() => setPassStatusApi(item.id, e.target.value))}
                className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
              >
                {toOptions(PASS_STATUS_LABELS).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <Link to={`/pass/${item.id}/edit`} className="rounded-lg border border-gray-300 px-3 py-1 text-sm dark:border-gray-600">Sửa</Link>
              <button
                onClick={() => window.confirm("Xóa bài này? Hành động không thể hoàn tác.") && act(() => deletePassApi(item.id))}
                className="rounded-lg border border-red-300 px-3 py-1 text-sm text-red-600 dark:border-red-800"
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