import { useEffect, useState, useRef } from "react";
import { adminReportsApi, adminHandleReportApi } from "../../api/admin";
import Pagination from "../../components/Pagination";
import { REPORT_REASON_LABELS, REPORT_STATUS_LABELS, REPORT_TARGET_LABELS } from "../../utils/labels";
import useRequestStatus from "../../hooks/useRequestStatus";
import { useTabDirection, useTabIndicator } from "../../hooks/useMotion";

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
  const tabsRef = useRef(null);
  const [tab, setTab] = useState("open");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [reloadKey, setReloadKey] = useState(0);
  const [forms, setForms] = useState({}); // { [id]: { resolution, action } }

  // Đang tải/lỗi suy ra từ khóa yêu cầu (không setState đồng bộ trong effect)
  const { loading, error, finish, setError } = useRequestStatus(JSON.stringify([tab, page, reloadKey]));

  useEffect(() => {
    let active = true;
    adminReportsApi({ status: tab, page })
      .then((res) => {
        if (!active) return;
        setData(res);
        finish();
      })
      .catch((err) => active && finish(err.response?.data?.message || "Không thể kết nối máy chủ"));
    return () => {
      active = false;
    };
  }, [tab, page, reloadKey, finish]);

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


  // Gạch chân trượt theo tab, nội dung trượt ngang theo hướng tab được chọn
  const tabIndex = TABS.indexOf(tab);
  useTabIndicator(tabsRef, tabIndex);
  const tabDir = useTabDirection(tabIndex);
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Báo cáo vi phạm</h1>

      <div ref={tabsRef} role="tablist" className="tablist flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <button key={t} onClick={() => { setTab(t); setPage(1); }}
            role="tab"
            aria-selected={tab === t}
            className="tab whitespace-nowrap">
            {REPORT_STATUS_LABELS[t]}
          </button>
        ))}
        <span aria-hidden="true" className="tab-indicator" />
      </div>

      {error && <p className="alert-error">{error}</p>}
      {loading && <div className="skeleton h-40" aria-busy="true" aria-label="Đang tải" />}
      {!loading && data.items.length === 0 && <p>Không có báo cáo nào trong mục này.</p>}

      <ul data-dir={tabDir} className="stagger space-y-4">
        {data.items.map((r) => {
          const link = targetLink(r);
          const closed = r.status === "resolved" || r.status === "dismissed";
          const f = form(r.id);
          return (
            <li key={r.id} className="space-y-3 card p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900 dark:text-red-100">
                  {REPORT_REASON_LABELS[r.reason]}
                </span>
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-muted dark:bg-gray-700">{REPORT_TARGET_LABELS[r.targetType]}</span>
                <span className="text-xs text-muted">{new Date(r.createdAt).toLocaleString("vi-VN")}</span>
              </div>

              <p className="text-sm">
                <span className="text-muted">Đối tượng: </span>
                {r.target.exists ? <b>{r.target.label}</b> : <i>đã bị xóa hoặc không còn tồn tại</i>}
                {link && r.target.exists && (
                  <a href={link} target="_blank" rel="noreferrer" className="ml-2 font-medium text-indigo-700 underline-offset-4 hover:underline dark:text-brand">Xem ↗</a>
                )}
              </p>
              <p className="text-sm">
                <span className="text-muted">Người báo cáo: </span>
                {r.reporter ? `${r.reporter.displayName} (${r.reporter.email})` : "—"}
              </p>
              {r.detail && <p className="rounded-xl bg-subtle p-3 text-sm">“{r.detail}”</p>}

              {closed ? (
                <p className="text-sm text-muted">
                  <b>{REPORT_STATUS_LABELS[r.status]}</b>
                  {r.resolvedAt && ` · ${new Date(r.resolvedAt).toLocaleString("vi-VN")}`}
                  {r.resolution && ` · ${r.resolution}`}
                </p>
              ) : (
                <div className="space-y-2 rounded-xl border border-line p-3">
                  <textarea
                    value={f.resolution}
                    onChange={(e) => setForm(r.id, { resolution: e.target.value })}
                    rows={2}
                    maxLength={500}
                    placeholder="Ghi chú kết quả xử lý (bắt buộc khi Đã xử lý / Bỏ qua)"
                    className="input text-sm"
                  />
                  <select value={f.action} onChange={(e) => setForm(r.id, { action: e.target.value })}
                    className="input text-sm">
                    {(ACTIONS[r.targetType] || ACTIONS.message).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <div className="flex flex-wrap gap-2">
                    {r.status === "open" && (
                      <button onClick={() => act(r.id, "reviewing")}
                        className="btn btn-secondary btn-sm">Đang xem xét</button>
                    )}
                    <button onClick={() => act(r.id, "resolved")}
                      className="btn btn-sm bg-emerald-600 text-white hover:bg-emerald-700">Đã xử lý</button>
                    <button onClick={() => act(r.id, "dismissed")}
                      className="btn btn-secondary btn-sm">Bỏ qua (không vi phạm)</button>
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