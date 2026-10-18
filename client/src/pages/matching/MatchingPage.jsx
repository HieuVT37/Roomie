import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listMatchesApi } from "../../api/matching";
import ProfileCard from "../../components/ProfileCard";
import FormField from "../../components/FormField";
import { SelectField, CheckField } from "../../components/FormControls";
import { GENDER_LABELS, toOptions } from "../../utils/labels";

const initialFilters = { minScore: "0", location: "", gender: "", includeIncompatible: false };

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
      minScore: filters.minScore,
      location: filters.location,
      gender: filters.gender,
      includeIncompatible: filters.includeIncompatible,
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

  const applyFilters = (e) => {
    e.preventDefault();
    setPage(1);
    setFilters(draft);
  };

  const needProfile = error?.code === "PROFILE_INCOMPLETE" || error?.code === "NOT_LOOKING";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gợi ý bạn cùng phòng</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Tỷ lệ Compatible là chỉ số ước tính từ hồ sơ, không đảm bảo hai người chắc chắn hòa hợp.
        </p>
      </div>

      <form onSubmit={applyFilters} className="grid items-end gap-4 rounded-2xl border border-gray-200 p-4 dark:border-gray-700 sm:grid-cols-4">
        <SelectField label="Điểm tối thiểu" id="minScore" value={draft.minScore}
          onChange={(e) => setDraft({ ...draft, minScore: e.target.value })}
          options={[{ value: "0", label: "Tất cả" }, { value: "50", label: "Từ 50%" }, { value: "70", label: "Từ 70%" }, { value: "80", label: "Từ 80%" }]} />
        <FormField label="Khu vực" id="location" value={draft.location} placeholder="Cầu Giấy"
          onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
        <SelectField label="Giới tính" id="gender" value={draft.gender} placeholder="Tất cả"
          onChange={(e) => setDraft({ ...draft, gender: e.target.value })} options={toOptions(GENDER_LABELS)} />
        <button type="submit" className="rounded-lg bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700">Lọc</button>
        <div className="sm:col-span-4">
          <CheckField id="incompat" label="Hiện cả hồ sơ không đạt tiêu chí bắt buộc"
            checked={draft.includeIncompatible} onChange={(v) => setDraft({ ...draft, includeIncompatible: v })} />
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
            <p>Chưa có hồ sơ nào phù hợp. Thử giảm điểm tối thiểu hoặc bỏ bộ lọc.</p>
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