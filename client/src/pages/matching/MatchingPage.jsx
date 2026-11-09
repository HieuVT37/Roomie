import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listMatchesApi } from "../../api/matching";
import ProfileCard from "../../components/ProfileCard";
import FormField from "../../components/FormField";
import { SelectField } from "../../components/FormControls";
import { useRestoreLastViewed, useReturnState } from "../../utils/lastViewed";
import Pagination from "../../components/Pagination";
import { EmptyState } from "../../components/ListStates";
import Icon from "../../components/Icon";
import useRequestStatus from "../../hooks/useRequestStatus";

const initialFilters = { q: "", location: "", minScore: "0" };

export default function MatchingPage() {
  const [filters, setFilters] = useReturnState("matching:filters", initialFilters);
  const [page, setPage] = useReturnState("matching:page", 1);
  const [draft, setDraft] = useState(filters);
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });

  // Đang tải/lỗi suy ra từ khóa yêu cầu (không setState đồng bộ trong effect)
  const { loading, error, finish } = useRequestStatus(JSON.stringify([page, filters]), null);

  useEffect(() => {
    let active = true;
    listMatchesApi({
      page,
      limit: 12,
      q: filters.q,
      location: filters.location,
      minScore: filters.minScore,
    })
      .then((res) => {
        if (!active) return;
        setData(res);
        finish();
      })
      .catch((err) =>
        active &&
        finish({
          code: err.response?.data?.code,
          message: err.response?.data?.message || "Không thể kết nối máy chủ",
        })
      );
    return () => {
      active = false;
    };
  }, [page, filters, finish]);

  const set = (name, value) => setDraft((d) => ({ ...d, [name]: value }));
  const onText = (e) => set(e.target.name, e.target.value);

  const applyFilters = (e) => {
    e.preventDefault();
    setPage(1);
    setFilters(draft);
  };

  const reset = () => {
    setDraft(initialFilters);
    setFilters(initialFilters);
    setPage(1);
  };

  const needProfile = error?.code === "PROFILE_INCOMPLETE" || error?.code === "NOT_LOOKING";

  useRestoreLastViewed(!loading && !error);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Gợi ý bạn cùng phòng</h1>
        <p className="text-sm text-muted">
          Tỷ lệ Compatible là chỉ số ước tính từ hồ sơ, không đảm bảo hai người chắc chắn hòa hợp.
          Roomie chỉ gợi ý người cùng giới tính với bạn.
        </p>
      </div>

      <form onSubmit={applyFilters} className="card filter-panel space-y-5 p-5 sm:p-6">
        <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:gap-x-4 lg:grid-cols-4">
          <FormField label="Mô tả" id="q" value={draft.q} onChange={onText}
            placeholder="Mô tả bản thân" maxLength={100} />
          <FormField label="Khu vực" id="location" value={draft.location} onChange={onText}
            placeholder="Cầu Giấy" />
          <SelectField label="Điểm tối thiểu" id="minScore" value={draft.minScore} onChange={onText}
            options={[
              { value: "0", label: "Tất cả" },
              { value: "50", label: "Từ 50%" },
              { value: "70", label: "Từ 70%" },
              { value: "80", label: "Từ 80%" },
            ]} />
        </div>

        <div className="flex gap-3">
          <button type="submit" className="btn btn-primary px-5">
            <Icon name="search" size={17} />
            Tìm kiếm
          </button>
          <button type="button" onClick={reset} className="btn btn-secondary px-5">
            Xóa bộ lọc
          </button>
        </div>
      </form>

      {loading && <p>Đang tìm người phù hợp...</p>}

      {!loading && needProfile && (
        <div className="rounded-[1.25rem] border border-indigo-200 bg-surface p-6 dark:border-indigo-900">
          <p className="mb-3">{error.message}</p>
          <Link to="/profile" className="btn btn-primary">Đến hồ sơ của tôi</Link>
        </div>
      )}

      {!loading && error && !needProfile && (
        <p className="alert-error">{error.message}</p>
      )}

      {!loading && !error && (
        <>
          <p className="text-sm text-muted">{data.total} kết quả</p>
          {data.items.length === 0 ? (
            <EmptyState icon="users">Không có hồ sơ nào phù hợp với bộ lọc.</EmptyState>
          ) : (
            <div className="stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((item) => (
                <ProfileCard key={item.userId} item={item} />
              ))}
            </div>
          )}

          <Pagination page={page} pages={data.pages} onChange={setPage} />
        </>
      )}
    </div>
  );
}