import { useEffect, useState } from "react";
import { adminUsersApi, adminUpdateUserApi, adminGrantPlanApi } from "../../api/admin";
import FormField from "../../components/FormField";
import Pagination from "../../components/Pagination";
import { SelectField } from "../../components/FormControls";
import { PLAN_LABELS, USER_STATUS_LABELS, toOptions } from "../../utils/labels";

const initial = { q: "", role: "", status: "", plan: "", landlord: "" };
const STATUS_COLOR = {
  active: "text-green-600 dark:text-green-400",
  suspended: "text-yellow-600 dark:text-yellow-400",
  banned: "text-red-600 dark:text-red-400",
  pending: "text-gray-500",
};

export default function AdminUsersPage() {
  const [draft, setDraft] = useState(initial);
  const [filters, setFilters] = useState(initial);
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [planForm, setPlanForm] = useState(null); // { id, planCode, days }

  useEffect(() => {
    let active = true;
    setLoading(true);
    adminUsersApi({ ...filters, page })
      .then((res) => active && setData(res))
      .catch((err) => active && setError(err.response?.data?.message || "Không thể kết nối máy chủ"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page, filters]);

  const onText = (e) => setDraft((d) => ({ ...d, [e.target.name]: e.target.value }));
  const apply = (e) => {
    e.preventDefault();
    setPage(1);
    setFilters(draft);
  };

  const patchRow = (id, patch) =>
    setData((d) => ({ ...d, items: d.items.map((u) => (u.id === id ? { ...u, ...patch } : u)) }));

  const act = async (fn) => {
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (err) {
      setError(err.response?.data?.message || "Không thể kết nối máy chủ");
    }
  };

  const changeStatus = (u, status) => {
    const note = status === "active"
      ? `Mở khóa cho ${u.email}?`
      : `Đổi trạng thái ${u.email} thành "${USER_STATUS_LABELS[status]}"? Người này sẽ không đăng nhập được và các tin đang hiển thị sẽ bị ngưng.`;
    if (!window.confirm(note)) return;
    act(async () => {
      const { user } = await adminUpdateUserApi(u.id, { status });
      patchRow(u.id, { status: user.status });
    });
  };

  const toggleLandlord = (u) =>
    act(async () => {
      const { user } = await adminUpdateUserApi(u.id, { isLandlord: !u.isLandlord });
      patchRow(u.id, { isLandlord: user.isLandlord });
    });

  const grant = () =>
    act(async () => {
      const res = await adminGrantPlanApi(planForm.id, planForm.planCode, Number(planForm.days) || 30);
      patchRow(planForm.id, { currentPlan: res.currentPlan });
      setNotice(
        res.expiresAt
          ? `Đã cấp gói ${PLAN_LABELS[res.currentPlan]}, hết hạn ${new Date(res.expiresAt).toLocaleDateString("vi-VN")}`
          : "Đã đưa người dùng về gói Basic"
      );
      setPlanForm(null);
    });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Người dùng <span className="text-base font-normal text-gray-500">({data.total})</span></h1>

      <form onSubmit={apply} className="grid items-end gap-4 rounded-2xl border border-gray-200 p-4 dark:border-gray-700 sm:grid-cols-3 lg:grid-cols-6">
        <div className="sm:col-span-3 lg:col-span-2">
          <FormField label="Tìm theo email hoặc tên" id="q" value={draft.q} onChange={onText} />
        </div>
        <SelectField label="Vai trò" id="role" value={draft.role} onChange={onText} placeholder="Tất cả"
          options={[{ value: "user", label: "Người dùng" }, { value: "admin", label: "Quản trị" }]} />
        <SelectField label="Trạng thái" id="status" value={draft.status} onChange={onText} placeholder="Tất cả"
          options={toOptions(USER_STATUS_LABELS)} />
        <SelectField label="Gói" id="plan" value={draft.plan} onChange={onText} placeholder="Tất cả"
          options={toOptions(PLAN_LABELS)} />
        <SelectField label="Chủ trọ" id="landlord" value={draft.landlord} onChange={onText} placeholder="Tất cả"
          options={[{ value: "true", label: "Là chủ trọ" }, { value: "false", label: "Không" }]} />
        <button type="submit" className="rounded-lg bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700">Lọc</button>
      </form>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">{error}</p>}
      {notice && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">{notice}</p>}
      {loading && <p>Đang tải...</p>}

      <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3">Người dùng</th>
              <th className="px-4 py-3">Gói</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Chủ trọ</th>
              <th className="px-4 py-3">Đăng nhập gần nhất</th>
              <th className="px-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((u) => (
              <tr key={u.id} className="border-t border-gray-100 align-top dark:border-gray-800">
                <td className="px-4 py-3">
                  <p className="font-medium">{u.displayName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                  {u.role === "admin" && <span className="rounded bg-indigo-100 px-1.5 text-xs text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">Quản trị</span>}
                </td>
                <td className="px-4 py-3">{PLAN_LABELS[u.currentPlan]}</td>
                <td className={`px-4 py-3 font-medium ${STATUS_COLOR[u.status]}`}>{USER_STATUS_LABELS[u.status]}</td>
                <td className="px-4 py-3">{u.isLandlord ? "Có" : "—"}</td>
                <td className="px-4 py-3 text-xs">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("vi-VN") : "Chưa đăng nhập"}</td>
                <td className="px-4 py-3">
                  {u.role === "admin" ? (
                    <span className="text-xs text-gray-400">Không thể thay đổi</span>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <select
                          value={u.status}
                          onChange={(e) => changeStatus(u, e.target.value)}
                          className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800"
                        >
                          {["active", "suspended", "banned"].map((s) => (
                            <option key={s} value={s}>{USER_STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                        <button onClick={() => toggleLandlord(u)}
                          className="rounded-lg border border-gray-300 px-2 py-1 text-xs dark:border-gray-600">
                          {u.isLandlord ? "Gỡ quyền chủ trọ" : "Cấp quyền chủ trọ"}
                        </button>
                        <button onClick={() => setPlanForm({ id: u.id, planCode: "plus", days: 30 })}
                          className="rounded-lg border border-gray-300 px-2 py-1 text-xs dark:border-gray-600">
                          Cấp gói
                        </button>
                      </div>
                      {planForm?.id === u.id && (
                        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                          <select value={planForm.planCode} onChange={(e) => setPlanForm({ ...planForm, planCode: e.target.value })}
                            className="rounded border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-900">
                            {Object.entries(PLAN_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                          {planForm.planCode !== "basic" && (
                            <input type="number" min="1" max="365" value={planForm.days}
                              onChange={(e) => setPlanForm({ ...planForm, days: e.target.value })}
                              className="w-16 rounded border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-900" />
                          )}
                          {planForm.planCode !== "basic" && <span className="text-xs">ngày</span>}
                          <button onClick={grant} className="rounded bg-indigo-600 px-2 py-1 text-xs text-white">Xác nhận</button>
                          <button onClick={() => setPlanForm(null)} className="text-xs text-gray-500">Hủy</button>
                        </div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && data.items.length === 0 && <p>Không có người dùng nào phù hợp.</p>}
      <Pagination page={page} pages={data.pages} onChange={setPage} />
    </div>
  );
}