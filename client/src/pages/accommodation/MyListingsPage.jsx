import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { myAccommodationsApi, setAccommodationStatusApi, deleteAccommodationApi } from "../../api/accommodations";
import AccommodationCard from "../../components/AccommodationCard";
import { LISTING_STATUS_LABELS, MODERATION_LABELS, toOptions } from "../../utils/labels";
import { useRestoreLastViewed } from "../../utils/lastViewed";
import { CardSkeletons, EmptyState } from "../../components/ListStates";
import Icon from "../../components/Icon";

export default function MyListingsPage() {
  const [data, setData] = useState({ items: [], quota: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  useRestoreLastViewed(!loading);

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
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Tin cho thuê của tôi</h1>
          {quota && (
            <p className="text-sm text-muted">
              Đang hiển thị {quota.active}/{quota.limit} tin (gói {quota.plan})
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/accommodation" className="btn btn-secondary">
            Xem tất cả tin
          </Link>
          <Link to="/accommodation/new" className="btn btn-primary">
            <Icon name="plus" size={18} />Đăng tin mới
          </Link>
        </div>
      </div>

      {error && <p className="alert-error">{error}</p>}
      {loading && <CardSkeletons />}
      {!loading && items.length === 0 && <EmptyState icon="home">Bạn chưa đăng tin nào.</EmptyState>}

      <div className={`stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-3 ${loading ? "hidden" : ""}`}>
        {items.map((item) => (
          <div key={item.id} className="space-y-2">
            <AccommodationCard item={item} showFavorite={false} />
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full bg-subtle px-2.5 py-0.5">{MODERATION_LABELS[item.moderationStatus]}</span>
              {item.moderationNote && <span className="text-red-600 dark:text-red-300">Lý do: {item.moderationNote}</span>}
              <span className="text-muted">{item.viewCount} lượt xem</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={item.status}
                onChange={(e) => act(() => setAccommodationStatusApi(item.id, e.target.value))}
                className="input !min-h-9 w-auto !py-1 text-sm"
              >
                {toOptions(LISTING_STATUS_LABELS).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <Link to={`/accommodation/${item.id}/edit`} className="btn btn-secondary btn-sm">Sửa</Link>
              <button
                onClick={() => window.confirm("Xóa tin này? Hành động không thể hoàn tác.") && act(() => deleteAccommodationApi(item.id))}
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