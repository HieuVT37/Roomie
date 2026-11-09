import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { listPassApi } from "../../api/pass";
import PassCard from "../../components/PassCard";
import FormField from "../../components/FormField";
import { SelectField } from "../../components/FormControls";
import { useRestoreLastViewed, useReturnState } from "../../utils/lastViewed";
import {
  PASS_TYPE_LABELS, ITEM_CATEGORY_LABELS, CONDITION_LABELS, DEAL_LABELS, toOptions,
} from "../../utils/labels";
import Pagination from "../../components/Pagination";
import { CardSkeletons, EmptyState } from "../../components/ListStates";
import Icon from "../../components/Icon";
import useRequestStatus from "../../hooks/useRequestStatus";
import { useTabDirection, useTabIndicator } from "../../hooks/useMotion";

const initialFilters = {
  type: "", q: "", area: "", minPrice: "", maxPrice: "", category: "", condition: "", dealType: "", sort: "newest",
};

const TABS = [
  { value: "", label: "Tất cả" },
  { value: "room", label: PASS_TYPE_LABELS.room },
  { value: "item", label: PASS_TYPE_LABELS.item },
];

export default function PassListPage() {
  const tabsRef = useRef(null);
  const { user } = useAuth();
  const [filters, setFilters] = useReturnState("pass:filters", initialFilters);
  const [page, setPage] = useReturnState("pass:page", 1);
  const [draft, setDraft] = useState(filters);
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });

  // Đang tải/lỗi suy ra từ khóa yêu cầu (không setState đồng bộ trong effect)
  const { loading, error, finish } = useRequestStatus(JSON.stringify([page, filters]));

  useEffect(() => {
    let active = true;
    listPassApi({ ...filters, page, limit: 12 })
      .then((res) => {
        if (!active) return;
        setData(res);
        finish();
      })
      .catch((err) => active && finish(err.response?.data?.message || "Không thể kết nối máy chủ"));
    return () => {
      active = false;
    };
  }, [page, filters, finish]);

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

  useRestoreLastViewed(!loading);


  // Gạch chân trượt theo tab, nội dung trượt ngang theo hướng tab được chọn
  const tabIndex = TABS.findIndex((t) => t.value === filters.type);
  useTabIndicator(tabsRef, tabIndex);
  const tabDir = useTabDirection(tabIndex);
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Pass phòng & đồ dùng</h1>
          <p className="text-sm text-muted">{data.total} bài đang đăng</p>
        </div>
        {user ? (
          <div className="flex gap-2">
            <Link to="/my-pass" className="btn btn-secondary">Bài của tôi</Link>
            <Link to="/pass/new" className="btn btn-primary"><Icon name="plus" size={18} />Đăng bài</Link>
          </div>
        ) : (
          <Link to="/login" className="btn btn-secondary">Đăng nhập để đăng bài</Link>
        )}
      </div>

      <div ref={tabsRef} role="tablist" className="tablist flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => changeType(t.value)}
            role="tab"
            aria-selected={filters.type === t.value}
            className="tab whitespace-nowrap"
          >
            {t.label}
          </button>
        ))}
        <span aria-hidden="true" className="tab-indicator" />
      </div>

      <form onSubmit={apply} className="card filter-panel space-y-5 p-5 sm:p-6">
        <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:gap-x-4 lg:grid-cols-4">
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
          <button type="submit" className="btn btn-primary px-5"><Icon name="search" size={17} />Tìm kiếm</button>
          <button type="button" onClick={reset} className="btn btn-secondary px-5">Xóa bộ lọc</button>
        </div>
      </form>

      {loading && <CardSkeletons />}
      {error && <p className="alert-error">{error}</p>}
      {!loading && !error && data.items.length === 0 && <EmptyState icon="package">Không có bài đăng nào phù hợp.</EmptyState>}

      <div data-dir={tabDir} className={`stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-3 ${loading ? "hidden" : ""}`}>
        {data.items.map((item) => (
          <PassCard key={`${item.id}-${item.isFavorite}`} item={item} />
        ))}
      </div>

      <Pagination page={page} pages={data.pages} onChange={setPage} />
    </div>
  );
}