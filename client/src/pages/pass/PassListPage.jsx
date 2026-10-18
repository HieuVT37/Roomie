import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { listPassApi } from "../../api/pass";
import PassCard from "../../components/PassCard";
import FormField from "../../components/FormField";
import { SelectField } from "../../components/FormControls";
import {
  PASS_TYPE_LABELS, ITEM_CATEGORY_LABELS, CONDITION_LABELS, DEAL_LABELS, toOptions,
} from "../../utils/labels";

const initialFilters = {
  type: "", q: "", area: "", minPrice: "", maxPrice: "", category: "", condition: "", dealType: "", sort: "newest",
};

const TABS = [
  { value: "", label: "Tất cả" },
  { value: "room", label: PASS_TYPE_LABELS.room },
  { value: "item", label: PASS_TYPE_LABELS.item },
];

export default function PassListPage() {
  const { user } = useAuth();
  const [draft, setDraft] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    listPassApi({ ...filters, page, limit: 12 })
      .then((res) => active && setData(res))
      .catch((err) => active && setError(err.response?.data?.message || "Không thể kết nối máy chủ"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page, filters]);

  const onText = (e) => setDraft((d) => ({ ...d, [e.target.name]: e.target.value }));

  // Đổi tab loại bài: áp dụng ngay, xóa bộ lọc riêng của đồ khi chuyển sang phòng
  const changeType = (type) => {
    const clearItem = type === "room" ? { category: "", condition: "", dealType: "" } : {};
    setDraft((d) => ({ ...d, type, ...clearItem }));
    setFilters((f) => ({ ...f, type, ...clearItem }));
    setPage(1);
  };

  const apply = (e) => {
    e.preventDefault();
    setPage(1);
    setFilters(draft);
  };
  const reset = () => {
    setDraft(initialFilters);
    setFilters(initialFilters);
    setPage(1);
  };

  const showItemFilters = draft.type !== "room";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pass phòng & đồ dùng</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{data.total} bài đang đăng</p>
        </div>
        {user ? (
          <div className="flex gap-2">
            <Link to="/my-pass" className="rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600">Bài của tôi</Link>
            <Link to="/pass/new" className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">+ Đăng bài</Link>
          </div>
        ) : (
          <Link to="/login" className="rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600">Đăng nhập để đăng bài</Link>
        )}
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => changeType(t.value)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm ${filters.type === t.value
              ? "border-indigo-600 font-semibold text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={apply} className="space-y-4 rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Từ khóa" id="q" value={draft.q} onChange={onText} placeholder="Bàn học, tủ lạnh..." />
          <FormField label="Khu vực" id="area" value={draft.area} onChange={onText} placeholder="Thanh Xuân" />
          <FormField label="Giá từ (VNĐ)" id="minPrice" type="number" min="0" step="10000" value={draft.minPrice} onChange={onText} />
          <FormField label="Giá đến (VNĐ)" id="maxPrice" type="number" min="0" step="10000" value={draft.maxPrice} onChange={onText} />
          {showItemFilters && (
            <>
              <SelectField label="Danh mục" id="category" value={draft.category} onChange={onText} placeholder="Tất cả"
                options={toOptions(ITEM_CATEGORY_LABELS)} />
              <SelectField label="Tình trạng" id="condition" value={draft.condition} onChange={onText} placeholder="Tất cả"
                options={toOptions(CONDITION_LABELS)} />
              <SelectField label="Hình thức" id="dealType" value={draft.dealType} onChange={onText} placeholder="Tất cả"
                options={toOptions(DEAL_LABELS)} />
            </>
          )}
          <SelectField label="Sắp xếp" id="sort" value={draft.sort} onChange={onText}
            options={[
              { value: "newest", label: "Mới nhất" },
              { value: "price_asc", label: "Giá tăng dần" },
              { value: "price_desc", label: "Giá giảm dần" },
            ]} />
        </div>
        <div className="flex gap-3">
          <button type="submit" className="rounded-lg bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700">Tìm kiếm</button>
          <button type="button" onClick={reset} className="rounded-lg border border-gray-300 px-5 py-2 dark:border-gray-600">Xóa bộ lọc</button>
        </div>
      </form>

      {loading && <p>Đang tải...</p>}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-red-600 dark:bg-red-950 dark:text-red-300">{error}</p>}
      {!loading && !error && data.items.length === 0 && <p>Không có bài đăng nào phù hợp.</p>}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {data.items.map((item) => (
          <PassCard key={`${item.id}-${item.isFavorite}`} item={item} />
        ))}
      </div>

      {data.pages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}
            className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">← Trước</button>
          <span className="text-sm">Trang {page}/{data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => setPage(page + 1)}
            className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Sau →</button>
        </div>
      )}
    </div>
  );
}