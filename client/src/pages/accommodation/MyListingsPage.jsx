import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { myAccommodationsApi, setAccommodationStatusApi, deleteAccommodationApi } from "../../api/accommodations";
import AccommodationCard from "../../components/AccommodationCard";
import { LISTING_STATUS_LABELS, MODERATION_LABELS, toOptions } from "../../utils/labels";

export default function MyListingsPage() {
  const [data, setData] = useState({ items: [], quota: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    myAccommodationsApi()
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
          <h1 className="text-2xl font-bold">Tin cho thuê của tôi</h1>
          {quota && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Đang hiển thị {quota.active}/{quota.limit} tin (gói {quota.plan})
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/accommodation" className="rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600">
            Xem tất cả tin
          </Link>
          <Link to="/accommodation/new" className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">
            + Đăng tin mới
          </Link>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">{error}</p>}
      {loading && <p>Đang tải...</p>}
      {!loading && items.length === 0 && <p>Bạn chưa đăng tin nào.</p>}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="space-y-2">
            <AccommodationCard item={item} showFavorite={false} />
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full bg-gray-100 px-2 py-0.5 dark:bg-gray-800">{MODERATION_LABELS[item.moderationStatus]}</span>
              {item.moderationNote && <span className="text-red-600 dark:text-red-300">Lý do: {item.moderationNote}</span>}
              <span className="text-gray-500 dark:text-gray-400">{item.viewCount} lượt xem</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={item.status}
                onChange={(e) => act(() => setAccommodationStatusApi(item.id, e.target.value))}
                className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
              >
                {toOptions(LISTING_STATUS_LABELS).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <Link to={`/accommodation/${item.id}/edit`} className="rounded-lg border border-gray-300 px-3 py-1 text-sm dark:border-gray-600">Sửa</Link>
              <button
                onClick={() => window.confirm("Xóa tin này? Hành động không thể hoàn tác.") && act(() => deleteAccommodationApi(item.id))}
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