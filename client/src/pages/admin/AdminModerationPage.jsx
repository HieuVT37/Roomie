import { useEffect, useState, useRef } from "react";
import { adminListingsApi, adminModerateApi, adminDeleteListingApi } from "../../api/admin";
import FormField from "../../components/FormField";
import Pagination from "../../components/Pagination";
import { MODERATION_LABELS, PASS_TYPE_LABELS, LISTING_STATUS_LABELS, PASS_STATUS_LABELS, passPriceText, formatVND } from "../../utils/labels";
import Icon from "../../components/Icon";
import useRequestStatus from "../../hooks/useRequestStatus";
import { useTabDirection, useTabIndicator } from "../../hooks/useMotion";

const KINDS = [
  { value: "accommodation", label: "Tin cho thuê phòng" },
  { value: "pass", label: "Bài Pass" },
];
const STATE_COLOR = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

export default function AdminModerationPage() {
  const tabsRef = useRef(null);
  const [kind, setKind] = useState("accommodation");
  const [moderation, setModeration] = useState("");
  const [qDraft, setQDraft] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [reloadKey, setReloadKey] = useState(0);
  const [rejecting, setRejecting] = useState(null); // { id, note }

  // Đang tải/lỗi suy ra từ khóa yêu cầu (không setState đồng bộ trong effect)
  const { loading, error, finish, setError } = useRequestStatus(JSON.stringify([kind, moderation, q, page, reloadKey]));

  useEffect(() => {
    let active = true;
    adminListingsApi({ kind, moderation, q, page })
      .then((res) => {
        if (!active) return;
        setData(res);
        finish();
      })
      .catch((err) => active && finish(err.response?.data?.message || "Không thể kết nối máy chủ"));
    return () => {
      active = false;
    };
  }, [kind, moderation, q, page, reloadKey, finish]);

  const act = async (fn) => {
    setError("");
    try {
      await fn();
      setRejecting(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể kết nối máy chủ");
    }
  };

  const changeKind = (value) => {
    setKind(value);
    setPage(1);
  };


  // Gạch chân trượt theo tab, nội dung trượt ngang theo hướng tab được chọn
  const tabIndex = KINDS.findIndex((k) => k.value === kind);
  useTabIndicator(tabsRef, tabIndex);
  const tabDir = useTabDirection(tabIndex);
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Duyệt tin <span className="text-base font-normal text-gray-500">({data.total})</span></h1>

      <div ref={tabsRef} role="tablist" className="tablist flex gap-1 overflow-x-auto border-b border-line">
        {KINDS.map((k) => (
          <button key={k.value} onClick={() => changeKind(k.value)}
            role="tab"
            aria-selected={kind === k.value}
            className="tab whitespace-nowrap">
            {k.label}
          </button>
        ))}
        <span aria-hidden="true" className="tab-indicator" />
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); setPage(1); setQ(qDraft); }}
        className="grid items-end gap-4 card p-5 sm:p-6 sm:grid-cols-[1fr_200px_auto_auto]"
      >
        <FormField label="Tìm theo tiêu đề" id="q" value={qDraft} onChange={(e) => setQDraft(e.target.value)} />
        <div>
          <label htmlFor="moderation" className="label">Trạng thái duyệt</label>
          <select id="moderation" value={moderation} onChange={(e) => { setModeration(e.target.value); setPage(1); }}
            className="input">
            <option value="">Tất cả</option>
            {Object.entries(MODERATION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <button type="submit" className="btn btn-primary"><Icon name="search" size={17} />Tìm kiếm</button>
        <button
          type="button"
          onClick={() => { setQDraft(""); setQ(""); setModeration(""); setPage(1); }}
          className="btn btn-secondary"
        >
          Xóa bộ lọc
        </button>
      </form>

      {error && <p className="alert-error">{error}</p>}
      {loading && <div className="skeleton h-40" aria-busy="true" aria-label="Đang tải" />}
      {!loading && data.items.length === 0 && <p>Không có tin nào trong mục này.</p>}

      <ul data-dir={tabDir} className="stagger space-y-4">
        {data.items.map((it) => {
          const href = it.kind === "pass" ? `/pass/${it.id}` : `/accommodation/${it.id}`;
          const price = it.kind === "pass"
            ? passPriceText({ type: it.type, price: it.price, itemInfo: {} })
            : formatVND(it.price) + "/tháng";
          const statusLabel = (it.kind === "pass" ? PASS_STATUS_LABELS : LISTING_STATUS_LABELS)[it.status];

          return (
            <li key={it.id} className="space-y-3 card p-5 sm:p-6">
              <div className="flex gap-4">
                <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-subtle">
                  {it.image ? <img src={it.image} alt="" className="h-full w-full object-cover" />
                    : <div className="flex h-full items-center justify-center text-indigo-300 dark:text-indigo-800"><Icon name="home" size={26} /></div>}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{it.title}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${STATE_COLOR[it.moderationStatus]}`}>
                      {MODERATION_LABELS[it.moderationStatus]}
                    </span>
                    {it.moderationStatus === "pending" && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${it.edited
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"}`}>
                        {it.edited ? "Vừa sửa" : "Tin mới"}
                      </span>
                    )}
                    {it.type && <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-muted dark:bg-gray-700">{PASS_TYPE_LABELS[it.type]}</span>}
                  </div>
                  <p className="text-sm font-semibold tabular-nums text-indigo-700 dark:text-brand">{price}</p>
                  <p className="text-xs text-muted">
                    Người đăng: {it.owner?.displayName} ({it.owner?.email}) · {it.edited ? "Sửa lúc " : "Gửi lúc "}{new Date(it.submittedAt || it.createdAt).toLocaleString("vi-VN")} · {statusLabel}
                  </p>
                  {it.moderationNote && (
                    <p className="text-xs text-red-600 dark:text-red-300">Lý do từ chối: {it.moderationNote}</p>
                  )}
                </div>
              </div>

              {rejecting?.id === it.id ? (
                <div className="slide-down space-y-2">
                  <textarea
                    value={rejecting.note}
                    onChange={(e) => setRejecting({ ...rejecting, note: e.target.value })}
                    rows={2}
                    maxLength={300}
                    placeholder="Lý do từ chối (người đăng sẽ nhìn thấy)"
                    className="input text-sm"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => act(() => adminModerateApi(it.kind, it.id, "rejected", rejecting.note))}
                      className="btn btn-sm bg-rose-600 text-white hover:bg-rose-700">Xác nhận từ chối</button>
                    <button onClick={() => setRejecting(null)} className="btn btn-secondary btn-sm">Hủy</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <a href={href} target="_blank" rel="noreferrer"
                    className="btn btn-secondary btn-sm">Xem chi tiết ↗</a>
                  {it.moderationStatus !== "approved" && (
                    <button onClick={() => act(() => adminModerateApi(it.kind, it.id, "approved"))}
                      className="btn btn-sm bg-emerald-600 text-white hover:bg-emerald-700">Duyệt</button>
                  )}
                  {it.moderationStatus !== "rejected" && (
                    <button onClick={() => setRejecting({ id: it.id, note: "" })}
                      className="btn btn-sm border-red-200 bg-surface text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40">
                      {it.moderationStatus === "approved" ? "Gỡ tin (từ chối)" : "Từ chối"}
                    </button>
                  )}
                  <button
                    onClick={() => window.confirm(`Xóa vĩnh viễn tin "${it.title}"? Không thể khôi phục.`) && act(() => adminDeleteListingApi(it.kind, it.id))}
                    className="btn btn-sm bg-rose-600 text-white hover:bg-rose-700 sm:ml-auto">
                    Xóa tin
                  </button>
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