import { useRef, useState } from "react";
import { slideOut } from "../hooks/useMotion";
import { createReportApi } from "../api/support";
import { SelectField } from "./FormControls";
import { REPORT_REASON_LABELS, toOptions } from "../utils/labels";
import Icon from "./Icon";

export default function ReportButton({ targetType, targetId, fullWidth = false }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("spam");
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const formRef = useRef(null);
  // Đóng form: trượt lên rồi mới ẩn
  const closeForm = (after) => slideOut(formRef.current, () => {
    setOpen(false);
    after?.();
  });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await createReportApi({ targetType, targetId, reason, detail });
      setMsg({ type: "ok", text: "Đã gửi báo cáo. Cảm ơn bạn, chúng tôi sẽ xem xét sớm." });
      closeForm(() => setDetail(""));
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Không thể kết nối máy chủ" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      {msg && (
        <p className={msg.type === "ok" ? "alert-success" : "alert-error"}>
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
  } btn btn-ghost btn-sm text-muted hover:!bg-rose-50 hover:!text-rose-600 dark:hover:!bg-rose-950/40 dark:hover:!text-rose-400`}
>
  <Icon name="flag" size={16} />
  Báo cáo vi phạm
</button>
      ) : (
        <form ref={formRef} onSubmit={submit} className="card slide-down space-y-3 p-4">
          <SelectField label="Lý do" id="report-reason" value={reason}
            onChange={(e) => setReason(e.target.value)} options={toOptions(REPORT_REASON_LABELS)} />
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Mô tả thêm (tùy chọn)"
            className="input text-sm"
          />
          <div className="flex gap-2">
            <button type="submit" disabled={busy}
              className="btn btn-sm bg-rose-600 text-white hover:bg-rose-700">
              {busy ? "Đang gửi..." : "Gửi báo cáo"}
            </button>
            <button type="button" onClick={() => closeForm()}
              className="btn btn-secondary btn-sm">Hủy</button>
          </div>
        </form>
      )}
    </div>
  );
}