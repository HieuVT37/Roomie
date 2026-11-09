import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { listFavoritesApi } from "../../api/favorites";
import AccommodationCard from "../../components/AccommodationCard";
import PassCard from "../../components/PassCard";
import { useRestoreLastViewed, useReturnState } from "../../utils/lastViewed";
import { CardSkeletons, EmptyState } from "../../components/ListStates";
import useRequestStatus from "../../hooks/useRequestStatus";
import { useTabDirection, useTabIndicator } from "../../hooks/useMotion";

const TABS = [
  { value: "accommodation", label: "Phòng trọ", link: "/accommodation" },
  { value: "pass", label: "Pass phòng & đồ", link: "/pass" },
];

export default function FavoritesPage() {
  const tabsRef = useRef(null);
  const [tab, setTab] = useReturnState("favorites:tab", "accommodation");
  const [items, setItems] = useState([]);

  // Đang tải/lỗi suy ra từ khóa yêu cầu (không setState đồng bộ trong effect)
  const { loading, error, finish } = useRequestStatus(JSON.stringify([tab]));

  useEffect(() => {
    let active = true;
    listFavoritesApi(tab)
      .then((res) => {
        if (!active) return;
        setItems(res.items);
        finish();
      })
      .catch((err) => active && finish(err.response?.data?.message || "Không thể kết nối máy chủ"));
    return () => {
      active = false;
    };
  }, [tab, finish]);

  // Bỏ tim thì gỡ thẻ khỏi danh sách ngay
  const handleToggle = (id, isFav) => {
    if (!isFav) setItems((list) => list.filter((i) => i.id !== id));
  };

  useRestoreLastViewed(!loading);
  const current = TABS.find((t) => t.value === tab);
  const Card = tab === "pass" ? PassCard : AccommodationCard;


  // Gạch chân trượt theo tab, nội dung trượt ngang theo hướng tab được chọn
  const tabIndex = TABS.findIndex((t) => t.value === tab);
  useTabIndicator(tabsRef, tabIndex);
  const tabDir = useTabDirection(tabIndex);
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold">Yêu thích</h1>

      <div ref={tabsRef} role="tablist" className="tablist flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            role="tab"
            aria-selected={tab === t.value}
            className="tab whitespace-nowrap"
          >
            {t.label}
          </button>
        ))}
        <span aria-hidden="true" className="tab-indicator" />
      </div>

      {error && <p className="alert-error">{error}</p>}
      {loading && <CardSkeletons />}
      {!loading && !error && items.length === 0 && (
        <EmptyState icon="heart" action={<Link to={current.link} className="btn btn-primary btn-sm mt-2">Xem ngay</Link>}>
          Bạn chưa lưu mục nào.
        </EmptyState>
      )}

      <div data-dir={tabDir} className={`stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-3 ${loading ? "hidden" : ""}`}>
        {items.map((item) => (
          <Card key={item.id} item={item} onFavoriteChange={handleToggle} />
        ))}
      </div>
    </div>
  );
}