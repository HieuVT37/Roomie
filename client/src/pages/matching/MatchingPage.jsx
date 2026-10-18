import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listMatchesApi } from "../../api/matching";
import ProfileCard from "../../components/ProfileCard";
import FormField from "../../components/FormField";
import { SelectField } from "../../components/FormControls";
import { GENDER_LABELS, toOptions } from "../../utils/labels";

const initialFilters = { q: "", location: "", gender: "", minScore: "0" };

export default function MatchingPage() {
  const [draft, setDraft] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    listMatchesApi({
      page,
      limit: 12,
      q: filters.q,
      location: filters.location,
      gender: filters.gender,
      minScore: filters.minScore,
    })
      .then((res) => active && setData(res))
      .catch((err) =>
        active &&
        setError({
          code: err.response?.data?.code,
          message: err.response?.data?.message || "Không thể kết nối máy chủ",
        })
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page, filters]);

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

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gợi ý bạn cùng phòng</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Tỷ lệ Compatible là chỉ số ước tính từ hồ sơ, không đảm bảo hai người chắc chắn hòa hợp.
        </p>
      </div>

      <form onSubmit={applyFilters} className="space-y-4 rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Mô tả" id="q" value={draft.q} onChange={onText}
            placeholder="Mô tả bản thân" maxLength={100} />
          <FormField label="Khu vực" id="location" value={draft.location} onChange={onText}
            placeholder="Cầu Giấy" />
          <SelectField label="Giới tính" id="gender" value={draft.gender} onChange={onText}
            placeholder="Tất cả" options={toOptions(GENDER_LABELS)} />
          <SelectField label="Điểm tối thiểu" id="minScore" value={draft.minScore} onChange={onText}
            options={[
              { value: "0", label: "Tất cả" },
              { value: "50", label: "Từ 50%" },
              { value: "70", label: "Từ 70%" },
              { value: "80", label: "Từ 80%" },
            ]} />
        </div>

        <div className="flex gap-3">
          <button type="submit" className="rounded-lg bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700">
            Tìm kiếm
          </button>
          <button type="button" onClick={reset} className="rounded-lg border border-gray-300 px-5 py-2 dark:border-gray-600">
            Xóa bộ lọc
          </button>
        </div>
      </form>

      {loading && <p>Đang tìm người phù hợp...</p>}

      {!loading && needProfile && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6 dark:border-indigo-900 dark:bg-indigo-950">
          <p className="mb-3">{error.message}</p>
          <Link to="/profile" className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">Đến hồ sơ của tôi</Link>
        </div>
      )}

      {!loading && error && !needProfile && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-red-600 dark:bg-red-950 dark:text-red-300">{error.message}</p>
      )}

      {!loading && !error && (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400">{data.total} kết quả</p>
          {data.items.length === 0 ? (
            <p>Không có hồ sơ nào phù hợp với bộ lọc.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((item) => (
                <ProfileCard key={item.userId} item={item} />
              ))}
            </div>
          )}

          {data.pages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">← Trước</button>
              <span className="text-sm">Trang {page}/{data.pages}</span>
              <button disabled={page >= data.pages} onClick={() => setPage(page + 1)}
                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Sau →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}