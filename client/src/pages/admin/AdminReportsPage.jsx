import { useEffect, useState } from "react";
import { adminReportsApi, adminHandleReportApi } from "../../api/admin";
import Pagination from "../../components/Pagination";
import { REPORT_REASON_LABELS, REPORT_STATUS_LABELS, REPORT_TARGET_LABELS } from "../../utils/labels";

const TABS = ["open", "reviewing", "resolved", "dismissed"];

const ACTIONS = {
  user: [["none", "Không áp dụng hành động"], ["suspend_user", "Khóa tài khoản người này"]],
  accommodation: [["none", "Không áp dụng hành động"], ["remove_content", "Gỡ tin này"], ["suspend_user", "Khóa tài khoản người đăng"]],
  pass: [["none", "Không áp dụng hành động"], ["remove_content", "Gỡ bài này"], ["suspend_user", "Khóa tài khoản người đăng"]],
  message: [["none", "Không áp dụng hành động"]],
};

const targetLink = (r) =>
  r.targetType === "accommodation" ? `/accommodation/${r.targetId}` : r.targetType === "pass" ? `/pass/${r.targetId}` : null;

export default function AdminReportsPage() {
  const [tab, setTab] = useState("open");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [forms, setForms] = useState({}); // { [id]: { resolution, action } }

  useEffect(() => {
    let active = true;
    setLoading(true);
    adminReportsApi({ status: tab, page })
      .then((res) => active && setData(res))
      .catch((err) => active && setError(err.response?.data?.message || "Không thể kết nối máy chủ"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [tab, page, reloadKey]);

  const form = (id) => forms[id] || { resolution: "", action: "none" };
  const setForm = (id, patch) => setForms((f) => ({ ...f, [id]: { ...form(id), ...patch } }));

  const act = async (id, status) => {
    setError("");
    const { resolution, action } = form(id);
    try {
      await adminHandleReportApi(id, { status, resolution: resolution || undefined, action: status === "resolved" ? action : "none" });
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể kết nối máy chủ");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Báo cáo vi phạm</h1>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700">
        {TABS.map((t) => (
          <button key={t} onClick={() => { setTab(t); setPage(1); }}
            className={`-mb-px border-b-2 px-4 py-2 text-sm ${tab === t
              ? "border-indigo-600 font-semibold text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"}`}>
            {REPORT_STATUS_LABELS[t]}
          </button>
        ))}
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">{error}</p>}
      {loading && <p>Đang tải...</p>}
      {!loading && data.items.length === 0 && <p>Không có báo cáo nào trong mục này.</p>}

      <ul className="space-y-4">
        {data.items.map((r) => {
          const link = targetLink(r);
          const closed = r.status === "resolved" || r.status === "dismissed";
          const f = form(r.id);
          return (
            <li key={r.id} className="space-y-3 rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900 dark:text-red-100">
                  {REPORT_REASON_LABELS[r.reason]}
                </span>
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs dark:bg-gray-700">{REPORT_TARGET_LABELS[r.targetType]}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(r.createdAt).toLocaleString("vi-VN")}</span>
              </div>

              <p className="text-sm">
                <span className="text-gray-500 dark:text-gray-400">Đối tượng: </span>
                {r.target.exists ? <b>{r.target.label}</b> : <i>đã bị xóa hoặc không còn tồn tại</i>}
                {link && r.target.exists && (
                  <a href={link} target="_blank" rel="noreferrer" className="ml-2 text-indigo-600 hover:underline dark:text-indigo-400">Xem ↗</a>
                )}
              </p>
              <p className="text-sm">
                <span className="text-gray-500 dark:text-gray-400">Người báo cáo: </span>
                {r.reporter ? `${r.reporter.displayName} (${r.reporter.email})` : "—"}
              </p>
              {r.detail && <p className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">“{r.detail}”</p>}

              {closed ? (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <b>{REPORT_STATUS_LABELS[r.status]}</b>
                  {r.resolvedAt && ` · ${new Date(r.resolvedAt).toLocaleString("vi-VN")}`}
                  {r.resolution && ` · ${r.resolution}`}
                </p>
              ) : (
                <div className="space-y-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <textarea
                    value={f.resolution}
                    onChange={(e) => setForm(r.id, { resolution: e.target.value })}
                    rows={2}
                    maxLength={500}
                    placeholder="Ghi chú kết quả xử lý (bắt buộc khi Đã xử lý / Bỏ qua)"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                  />
                  <select value={f.action} onChange={(e) => setForm(r.id, { action: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800">
                    {(ACTIONS[r.targetType] || ACTIONS.message).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <div className="flex flex-wrap gap-2">
                    {r.status === "open" && (
                      <button onClick={() => act(r.id, "reviewing")}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600">Đang xem xét</button>
                    )}
                    <button onClick={() => act(r.id, "resolved")}
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700">Đã xử lý</button>
                    <button onClick={() => act(r.id, "dismissed")}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600">Bỏ qua (không vi phạm)</button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <Pagination page={page} pages={data.pages} onChange={setPage} />
    </div>
  );
}