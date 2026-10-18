import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listFavoritesApi } from "../../api/favorites";
import AccommodationCard from "../../components/AccommodationCard";
import PassCard from "../../components/PassCard";

const TABS = [
  { value: "accommodation", label: "Phòng trọ", link: "/accommodation" },
  { value: "pass", label: "Pass phòng & đồ", link: "/pass" },
];

export default function FavoritesPage() {
  const [tab, setTab] = useState("accommodation");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    listFavoritesApi(tab)
      .then((res) => active && setItems(res.items))
      .catch((err) => active && setError(err.response?.data?.message || "Không thể kết nối máy chủ"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [tab]);

  // Bỏ tim thì gỡ thẻ khỏi danh sách ngay
  const handleToggle = (id, isFav) => {
    if (!isFav) setItems((list) => list.filter((i) => i.id !== id));
  };

  const current = TABS.find((t) => t.value === tab);
  const Card = tab === "pass" ? PassCard : AccommodationCard;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <h1 className="text-2xl font-bold">Yêu thích</h1>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm ${tab === t.value
              ? "border-indigo-600 font-semibold text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-red-600 dark:bg-red-950 dark:text-red-300">{error}</p>}
      {loading && <p>Đang tải...</p>}
      {!loading && !error && items.length === 0 && (
        <p>
          Bạn chưa lưu mục nào.{" "}
          <Link to={current.link} className="text-indigo-600 hover:underline dark:text-indigo-400">Xem ngay →</Link>
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id} item={item} onFavoriteChange={handleToggle} />
        ))}
      </div>
    </div>
  );
}