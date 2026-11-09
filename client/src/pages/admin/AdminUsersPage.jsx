import { useEffect, useState } from "react";
import {
  adminUsersApi,
  adminUpdateUserApi,
  adminGrantPlanApi,
  adminDeleteUserApi,
} from "../../api/admin";
import FormField from "../../components/FormField";
import Pagination from "../../components/Pagination";
import { SelectField } from "../../components/FormControls";
import { PLAN_LABELS, USER_STATUS_LABELS, toOptions } from "../../utils/labels";
import useRequestStatus from "../../hooks/useRequestStatus";

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
  const [notice, setNotice] = useState("");
  const [planForm, setPlanForm] = useState(null); // { id, planCode, days }

  // Đang tải/lỗi suy ra từ khóa yêu cầu (không setState đồng bộ trong effect)
  const { loading, error, finish, setError } = useRequestStatus(JSON.stringify([page, filters]));

  useEffect(() => {
    let active = true;
    adminUsersApi({ ...filters, page })
      .then((res) => {
        if (!active) return;
        setData(res);
        finish();
      })
      .catch(
        (err) =>
          active &&
          finish(err.response?.data?.message || "Không thể kết nối máy chủ"),
      );
    return () => {
      active = false;
    };
  }, [page, filters, finish]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 6000); 
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(""), 6000);
    return () => clearTimeout(timer);
  }, [error, setError]);

  const onText = (e) =>
    setDraft((d) => ({ ...d, [e.target.name]: e.target.value }));
  const apply = (e) => {
    e.preventDefault();
    setPage(1);
    setFilters(draft);
  };

  const patchRow = (id, patch) =>
    setData((d) => ({
      ...d,
      items: d.items.map((u) => (u.id === id ? { ...u, ...patch } : u)),
    }));

  const act = async (fn) => {
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (err) {
      setError(err.response?.data?.message || "Không thể kết nối máy chủ");
    }
  };

  const removeUser = (u) => {
    const msg = `XÓA VĨNH VIỄN tài khoản ${u.email}?\n\nHồ sơ, các tin đăng và gói đăng ký của người này sẽ bị xóa. Hành động này không thể hoàn tác.`;
    if (!window.confirm(msg)) return;
    act(async () => {
      await adminDeleteUserApi(u.id);
      setData((d) => ({
        ...d,
        items: d.items.filter((x) => x.id !== u.id),
        total: Math.max(0, d.total - 1),
      }));
      if (planForm?.id === u.id) setPlanForm(null);
      setNotice(`Đã xóa tài khoản ${u.email}`);
    });
  };

  const changeStatus = (u, status) => {
    // Chọn "Xóa tài khoản" trong dropdown -> chuyển sang luồng xóa
    if (status === "delete") return removeUser(u);

    const note =
      status === "active"
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
      const { user } = await adminUpdateUserApi(u.id, {
        isLandlord: !u.isLandlord,
      });
      patchRow(u.id, { isLandlord: user.isLandlord });
    });

  const grant = () =>
    act(async () => {
      const res = await adminGrantPlanApi(
        planForm.id,
        planForm.planCode,
        Number(planForm.days) || 30,
      );
      patchRow(planForm.id, { currentPlan: res.currentPlan });
      setNotice(
        res.expiresAt
          ? `Đã cấp gói ${PLAN_LABELS[res.currentPlan]}, hết hạn ${new Date(res.expiresAt).toLocaleDateString("vi-VN")}`
          : "Đã đưa người dùng về gói Basic",
      );
      setPlanForm(null);
    });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">
        Người dùng{" "}
        <span className="text-base font-normal text-gray-500">
          ({data.total})
        </span>
      </h1>

      <form
        onSubmit={apply}
        className="grid items-end gap-4 card p-5 sm:p-6 sm:grid-cols-3 lg:grid-cols-6"
      >
        <div className="sm:col-span-3 lg:col-span-2">
          <FormField
            label="Tìm theo email hoặc tên"
            id="q"
            value={draft.q}
            onChange={onText}
          />
        </div>
        <SelectField
          label="Vai trò"
          id="role"
          value={draft.role}
          onChange={onText}
          placeholder="Tất cả"
          options={[
            { value: "user", label: "Người dùng" },
            { value: "admin", label: "Quản trị" },
          ]}
        />
        <SelectField
          label="Trạng thái"
          id="status"
          value={draft.status}
          onChange={onText}
          placeholder="Tất cả"
          options={toOptions(USER_STATUS_LABELS)}
        />
        <SelectField
          label="Gói"
          id="plan"
          value={draft.plan}
          onChange={onText}
          placeholder="Tất cả"
          options={toOptions(PLAN_LABELS)}
        />
        <SelectField
          label="Chủ trọ"
          id="landlord"
          value={draft.landlord}
          onChange={onText}
          placeholder="Tất cả"
          options={[
            { value: "true", label: "Là chủ trọ" },
            { value: "false", label: "Không" },
          ]}
        />
        <button
          type="submit"
          className="btn btn-primary"
        >
          Lọc
        </button>
      </form>

      {error && (
        <p className="alert-error">
          {error}
        </p>
      )}
      {notice && (
        <p className="alert-success">
          {notice}
        </p>
      )}
      {loading && <div className="skeleton h-40" aria-busy="true" aria-label="Đang tải" />}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Gói</th>
              <th>Trạng thái</th>
              <th>Chủ trọ</th>
              <th>Đăng nhập</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((u) => (
              <tr
                key={u.id}
                className="border-t border-gray-100 align-top dark:border-gray-800"
              >
                <td>
                  <p className="font-medium">{u.displayName}</p>
                  <p className="text-xs text-muted">
                    {u.email}
                  </p>
                  {u.role === "admin" && (
                    <span className="rounded bg-indigo-100 px-1.5 text-xs text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
                      Quản trị
                    </span>
                  )}
                </td>
                <td>{PLAN_LABELS[u.currentPlan]}</td>
                <td
                  className={`px-4 py-3 font-medium ${STATUS_COLOR[u.status]}`}
                >
                  {USER_STATUS_LABELS[u.status]}
                </td>
                <td>{u.isLandlord ? "Có" : "—"}</td>
                <td className="text-xs">
                  {u.lastLoginAt
                    ? new Date(u.lastLoginAt).toLocaleString("vi-VN")
                    : "Chưa đăng nhập"}
                </td>
                <td>
                  {u.role === "admin" ? (
                    <span className="text-xs text-gray-400">
                      Không thể thay đổi
                    </span>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex flex-nowrap items-center gap-2">
                        <select
                          value={u.status}
                          onChange={(e) => changeStatus(u, e.target.value)}
                          className="input !min-h-9 w-auto !py-1 text-sm"
                        >
                          {["active", "suspended", "banned"].map((s) => (
                            <option key={s} value={s}>
                              {USER_STATUS_LABELS[s]}
                            </option>
                          ))}
                          <option value="delete">Xóa tài khoản</option>
                        </select>
                        <button
                          onClick={() => toggleLandlord(u)}
                          className="btn btn-secondary btn-sm"
                        >
                          {u.isLandlord
                            ? "Gỡ quyền chủ trọ"
                            : "Cấp quyền chủ trọ"}
                        </button>
                        <button
                          onClick={() =>
                            setPlanForm({
                              id: u.id,
                              planCode: "plus",
                              days: 30,
                            })
                          }
                          className="btn btn-secondary btn-sm"
                        >
                          Cấp gói
                        </button>
                      </div>
                      {planForm?.id === u.id && (
                        <div className="slide-down flex flex-wrap items-center gap-2 rounded-xl bg-subtle p-2">
                          <select
                            value={planForm.planCode}
                            onChange={(e) =>
                              setPlanForm({
                                ...planForm,
                                planCode: e.target.value,
                              })
                            }
                            className="input !min-h-8 w-auto !px-2 !py-1 text-xs"
                          >
                            {Object.entries(PLAN_LABELS).map(([v, l]) => (
                              <option key={v} value={v}>
                                {l}
                              </option>
                            ))}
                          </select>
                          {planForm.planCode !== "basic" && (
                            <input
                              type="number"
                              min="1"
                              max="365"
                              value={planForm.days}
                              onChange={(e) =>
                                setPlanForm({
                                  ...planForm,
                                  days: e.target.value,
                                })
                              }
                              className="input !min-h-8 !w-16 !px-2 !py-1 text-xs"
                            />
                          )}
                          {planForm.planCode !== "basic" && (
                            <span className="text-xs">ngày</span>
                          )}
                          <button
                            onClick={grant}
                            className="btn btn-primary !min-h-8 px-3 py-1 text-xs"
                          >
                            Xác nhận
                          </button>
                          <button
                            onClick={() => setPlanForm(null)}
                            className="text-xs text-gray-500"
                          >
                            Hủy
                          </button>
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

      {!loading && data.items.length === 0 && (
        <p>Không có người dùng nào phù hợp.</p>
      )}
      <Pagination page={page} pages={data.pages} onChange={setPage} />
    </div>
  );
}
