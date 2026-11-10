import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { listAccommodationsApi, accommodationMetaApi } from "../../api/accommodations";
import AccommodationCard from "../../components/AccommodationCard";
import FormField from "../../components/FormField";
import MoneyField from "../../components/MoneyField";
import { SelectField } from "../../components/FormControls";
import { AMENITIES, ROOM_TYPE_LABELS, toOptions } from "../../utils/labels";
import { useRestoreLastViewed, useReturnState } from "../../utils/lastViewed";
import Pagination from "../../components/Pagination";
import { CardSkeletons, EmptyState } from "../../components/ListStates";
import Icon from "../../components/Icon";
import useRequestStatus from "../../hooks/useRequestStatus";

const initialFilters = {
  q: "", district: "", roomType: "", minPrice: "", maxPrice: "", minArea: "", amenities: [], sort: "newest",
};

export default function AccommodationListPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useReturnState("accommodation:filters", initialFilters);
  const [page, setPage] = useReturnState("accommodation:page", 1);
  const [draft, setDraft] = useState(filters);
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [districts, setDistricts] = useState([]);
  // Bảng tiện nghi thu gọn mặc định; tự mở nếu đang có tiện nghi được chọn (ví dụ khi quay lại trang)
  const [showAmenities, setShowAmenities] = useState(() => filters.amenities.length > 0);

  useEffect(() => {
    accommodationMetaApi().then((m) => setDistricts(m.districts)).catch(() => {});
  }, []);

  // Đang tải/lỗi suy ra từ khóa yêu cầu (không setState đồng bộ trong effect)
  const { loading, error, finish } = useRequestStatus(JSON.stringify([page, filters]));

  useEffect(() => {
    let active = true;
    listAccommodationsApi({
      ...filters,
      amenities: filters.amenities.join(","),
      page,
      limit: 12,
    })
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

  const set = (name, value) => setDraft((d) => ({ ...d, [name]: value }));
  const onText = (e) => set(e.target.name, e.target.value);
  const toggleAmenity = (a) =>
    set("amenities", draft.amenities.includes(a) ? draft.amenities.filter((x) => x !== a) : [...draft.amenities, a]);

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

  useRestoreLastViewed(!loading);
  
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Tìm phòng trọ</h1>
          <p className="text-sm text-muted">{data.total} phòng đang còn trống</p>
        </div>
        {user?.isLandlord && (
          <div className="flex gap-2">
            <Link to="/my-listings" className="btn btn-secondary">Tin của tôi</Link>
            <Link to="/accommodation/new" className="btn btn-primary">
              <Icon name="plus" size={18} />Đăng tin
            </Link>
          </div>
        )}
      </div>

      <form onSubmit={apply} className="card filter-panel space-y-5 p-5 sm:p-6">
        <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:gap-x-4 lg:grid-cols-4">
          <FormField label="Từ khóa" id="q" value={draft.q} onChange={onText} placeholder="Tên đường, phường, tiêu đề..." />
          {/* Quận/huyện: gõ để tìm (không cần dấu), gợi ý các quận đang có phòng */}
          <FormField label="Quận/huyện" id="district" value={draft.district} onChange={onText}
            placeholder="Ví dụ: Cầu Giấy" list="district-options" autoComplete="off" maxLength={50} />
          <datalist id="district-options">
            {districts.map((d) => <option key={d} value={d} />)}
          </datalist>
          <SelectField label="Loại phòng" id="roomType" value={draft.roomType} onChange={onText} placeholder="Tất cả"
            options={toOptions(ROOM_TYPE_LABELS)} />
          <SelectField label="Sắp xếp" id="sort" value={draft.sort} onChange={onText}
            options={[
              { value: "newest", label: "Mới nhất" },
              { value: "price_asc", label: "Giá tăng dần" },
              { value: "price_desc", label: "Giá giảm dần" },
              { value: "area_desc", label: "Diện tích lớn nhất" },
            ]} />
          <MoneyField label="Giá từ (VNĐ)" id="minPrice" value={draft.minPrice} onChange={onText} />
          <MoneyField label="Giá đến (VNĐ)" id="maxPrice" value={draft.maxPrice} onChange={onText} />
          <FormField label="Diện tích từ (m²)" id="minArea" type="number" min="0" value={draft.minArea} onChange={onText} />

          {/* Nút thu gọn/mở rộng tiện nghi: góc phải dưới, ngay dưới cột "Sắp xếp" */}
          <div className="flex items-end justify-end">
            <button
              type="button"
              onClick={() => setShowAmenities((v) => !v)}
              aria-expanded={showAmenities}
              aria-controls="amenity-panel"
              // Cùng kích thước với ô nhập: cao 44px (min-h-11 như .input), rộng trọn ô lưới, chữ trái – mũi tên phải
              className="btn btn-secondary min-h-11 w-full !justify-between px-3.5"
            >
              <span className="flex items-center gap-2">
                <Icon name="sliders" size={17} />
                Tiện nghi
                {draft.amenities.length > 0 && (
                  <span className="rounded-full bg-btn px-2 text-xs font-semibold tabular-nums text-btn-ink">
                    {draft.amenities.length}
                  </span>
                )}
              </span>
              <Icon
                name="chevronRight"
                size={16}
                className={`text-muted transition-transform duration-300 ${showAmenities ? "-rotate-90" : "rotate-90"}`}
              />
            </button>
          </div>
        </div>

        {/* Bảng tiện nghi: sổ xuống / thu lại mượt (chuyển chiều cao dòng lưới 0fr ↔ 1fr) */}
        <div
          id="amenity-panel"
          className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out-soft ${
            showAmenities ? "grid-rows-[1fr] opacity-100" : "mb-0 grid-rows-[0fr] opacity-0"
          }`}
          inert={!showAmenities}
        >
          <div className="overflow-hidden">
            <div className="rounded-xl border border-line bg-subtle/60 p-4">
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map((a) => (
                  <button
                    type="button"
                    key={a}
                    onClick={() => toggleAmenity(a)}
                    aria-pressed={draft.amenities.includes(a)}
                    className="chip"
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" className="btn btn-primary px-5"><Icon name="search" size={17} />Tìm kiếm</button>
          <button type="button" onClick={reset} className="btn btn-secondary px-5">Xóa bộ lọc</button>
        </div>
      </form>

      {loading && <CardSkeletons />}
      {error && <p className="alert-error">{error}</p>}
      {!loading && !error && data.items.length === 0 && <EmptyState icon="home">Không có phòng nào phù hợp với bộ lọc.</EmptyState>}

      <div className={`stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-3 ${loading ? "hidden" : ""}`}>
        {data.items.map((item) => (
          <AccommodationCard key={`${item.id}-${item.isFavorite}`} item={item} />
        ))}
      </div>

      <Pagination page={page} pages={data.pages} onChange={setPage} />
    </div>
  );
}