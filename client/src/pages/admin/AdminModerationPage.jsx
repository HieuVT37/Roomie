import { useEffect, useState } from "react";
import { adminListingsApi, adminModerateApi, adminDeleteListingApi } from "../../api/admin";
import FormField from "../../components/FormField";
import Pagination from "../../components/Pagination";
import { MODERATION_LABELS, PASS_TYPE_LABELS, LISTING_STATUS_LABELS, PASS_STATUS_LABELS, passPriceText, formatVND } from "../../utils/labels";

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
  const [kind, setKind] = useState("accommodation");
  const [moderation, setModeration] = useState("");
  const [qDraft, setQDraft] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [rejecting, setRejecting] = useState(null); // { id, note }

  useEffect(() => {
    let active = true;
    setLoading(true);
    adminListingsApi({ kind, moderation, q, page })
      .then((res) => active && setData(res))
      .catch((err) => active && setError(err.response?.data?.message || "Không thể kết nối máy chủ"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [kind, moderation, q, page, reloadKey]);

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Duyệt tin <span className="text-base font-normal text-gray-500">({data.total})</span></h1>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {KINDS.map((k) => (
          <button key={k.value} onClick={() => changeKind(k.value)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm ${kind === k.value
              ? "border-indigo-600 font-semibold text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"}`}>
            {k.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); setPage(1); setQ(qDraft); }}
        className="grid items-end gap-4 rounded-2xl border border-gray-200 p-4 dark:border-gray-700 sm:grid-cols-[1fr_200px_auto]"
      >
        <FormField label="Tìm theo tiêu đề" id="q" value={qDraft} onChange={(e) => setQDraft(e.target.value)} />
        <div>
          <label htmlFor="moderation" className="mb-1 block text-sm font-medium">Trạng thái duyệt</label>
          <select id="moderation" value={moderation} onChange={(e) => { setModeration(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800">
            <option value="">Tất cả</option>
            {Object.entries(MODERATION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <button type="submit" className="rounded-lg bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700">Tìm</button>
      </form>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">{error}</p>}
      {loading && <p>Đang tải...</p>}
      {!loading && data.items.length === 0 && <p>Không có tin nào trong mục này.</p>}

      <ul className="space-y-4">
        {data.items.map((it) => {
          const href = it.kind === "pass" ? `/pass/${it.id}` : `/accommodation/${it.id}`;
          const price = it.kind === "pass"
            ? passPriceText({ type: it.type, price: it.price, itemInfo: {} })
            : formatVND(it.price) + "/tháng";
          const statusLabel = (it.kind === "pass" ? PASS_STATUS_LABELS : LISTING_STATUS_LABELS)[it.status];

          return (
            <li key={it.id} className="space-y-3 rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex gap-4">
                <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                  {it.image ? <img src={it.image} alt="" className="h-full w-full object-cover" />
                    : <div className="flex h-full items-center justify-center text-2xl">🏠</div>}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{it.title}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${STATE_COLOR[it.moderationStatus]}`}>
                      {MODERATION_LABELS[it.moderationStatus]}
                    </span>
                    {it.type && <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs dark:bg-gray-700">{PASS_TYPE_LABELS[it.type]}</span>}
                  </div>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400">{price}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Người đăng: {it.owner?.displayName} ({it.owner?.email}) · {new Date(it.createdAt).toLocaleString("vi-VN")} · {statusLabel}
                  </p>
                  {it.moderationNote && (
                    <p className="text-xs text-red-600 dark:text-red-300">Lý do từ chối: {it.moderationNote}</p>
                  )}
                </div>
              </div>

              {rejecting?.id === it.id ? (
                <div className="space-y-2">
                  <textarea
                    value={rejecting.note}
                    onChange={(e) => setRejecting({ ...rejecting, note: e.target.value })}
                    rows={2}
                    maxLength={300}
                    placeholder="Lý do từ chối (người đăng sẽ nhìn thấy)"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => act(() => adminModerateApi(it.kind, it.id, "rejected", rejecting.note))}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700">Xác nhận từ chối</button>
                    <button onClick={() => setRejecting(null)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600">Hủy</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <a href={href} target="_blank" rel="noreferrer"
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600">Xem chi tiết ↗</a>
                  {it.moderationStatus !== "approved" && (
                    <button onClick={() => act(() => adminModerateApi(it.kind, it.id, "approved"))}
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700">Duyệt</button>
                  )}
                  {it.moderationStatus !== "rejected" && (
                    <button onClick={() => setRejecting({ id: it.id, note: "" })}
                      className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 dark:border-red-800">
                      {it.moderationStatus === "approved" ? "Gỡ tin (từ chối)" : "Từ chối"}
                    </button>
                  )}
                  <button
                    onClick={() => window.confirm(`Xóa vĩnh viễn tin "${it.title}"? Không thể khôi phục.`) && act(() => adminDeleteListingApi(it.kind, it.id))}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 sm:ml-auto">
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