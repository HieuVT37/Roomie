import { useState } from "react";
import { createReportApi } from "../api/support";
import { SelectField } from "./FormControls";
import { REPORT_REASON_LABELS, toOptions } from "../utils/labels";

export default function ReportButton({ targetType, targetId, fullWidth = false }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("spam");
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await createReportApi({ targetType, targetId, reason, detail });
      setMsg({ type: "ok", text: "Đã gửi báo cáo. Cảm ơn bạn, chúng tôi sẽ xem xét sớm." });
      setOpen(false);
      setDetail("");
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Không thể kết nối máy chủ" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      {msg && (
        <p className={`rounded-lg px-3 py-2 text-sm ${msg.type === "ok"
          ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
          : "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300"}`}>
          {msg.text}
        </p>
      )}

      {!open ? (
        <button
  type="button"
  onClick={() => {
    setOpen(true);
    setMsg(null);
  }}
  className={`${
    fullWidth ? "flex w-full" : "inline-flex"
  } items-center justify-center gap-2 rounded-lg border border-yellow-300 px-4 py-2 text-sm font-medium text-yellow-400 hover:bg-yellow-50 dark:border-yellow-700 dark:text-yellow-400 dark:hover:bg-yellow-950`}
>
  🚩 Báo cáo vi phạm
</button>
      ) : (
        <form onSubmit={submit} className="space-y-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          <SelectField label="Lý do" id="report-reason" value={reason}
            onChange={(e) => setReason(e.target.value)} options={toOptions(REPORT_REASON_LABELS)} />
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Mô tả thêm (tùy chọn)"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-800"
          />
          <div className="flex gap-2">
            <button type="submit" disabled={busy}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-60">
              {busy ? "Đang gửi..." : "Gửi báo cáo"}
            </button>
            <button type="button" onClick={() => setOpen(false)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600">Hủy</button>
          </div>
        </form>
      )}
    </div>
  );
}