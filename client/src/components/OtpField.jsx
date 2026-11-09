import { useEffect, useState } from "react";

// Ô nhập mã OTP 6 số: chữ to, giãn cách, bàn phím số trên điện thoại,
// điện thoại tự gợi ý mã từ tin nhắn/email (autocomplete="one-time-code")
export function OtpField({ value, onChange, id = "code" }) {
  return (
    <div>
      <label htmlFor={id} className="label">Mã xác thực (6 số)</label>
      <input
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d{6}"
        maxLength={6}
        required
        placeholder="••••••"
        className="input h-16 text-center text-3xl font-semibold tracking-[0.6em] tabular-nums"
      />
    </div>
  );
}

// Nút "Gửi lại mã" có đếm ngược (khớp thời gian chờ 60 giây của server)
export function ResendButton({ onResend, initialWait = 60 }) {
  const [wait, setWait] = useState(initialWait);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (wait <= 0) return undefined;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const resend = async () => {
    setBusy(true);
    setNote("");
    try {
      await onResend();
      setNote("Đã gửi mã mới, vui lòng kiểm tra email (cả mục Spam).");
      setWait(60);
    } catch (err) {
      setNote(err.response?.data?.message || "Không gửi được mã, vui lòng thử lại");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="text-center text-sm text-muted">
      {wait > 0 ? (
        <span>Gửi lại mã sau <b className="tabular-nums text-ink">{wait}s</b></span>
      ) : (
        <button type="button" onClick={resend} disabled={busy}
          className="font-medium text-indigo-700 underline-offset-4 hover:underline disabled:opacity-60 dark:text-brand">
          {busy ? "Đang gửi..." : "Gửi lại mã"}
        </button>
      )}
      {note && <p className="mt-2">{note}</p>}
    </div>
  );
}
