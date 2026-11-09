import { useState } from "react";
import { changePasswordApi } from "../api/auth";
import FormField from "./FormField";
import PasswordStrength from "./fx/PasswordStrength";
import { toast } from "./fx/Toaster";

// Đổi mật khẩu khi đang đăng nhập: nhập mật khẩu hiện tại + mật khẩu mới.
// Đổi xong, các thiết bị khác bị đăng xuất; thiết bị này vẫn đăng nhập.
export default function ChangePasswordCard() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const onText = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.newPassword !== form.confirm) {
      setError("Mật khẩu mới nhập lại không khớp");
      return;
    }
    setSaving(true);
    try {
      await changePasswordApi({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
      toast("Đã đổi mật khẩu");
    } catch (err) {
      setError(err.response?.data?.message || "Không thể kết nối máy chủ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="card mx-auto max-w-4xl space-y-4 p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold">Đổi mật khẩu</h2>
        <p className="mt-1 text-sm text-muted">Sau khi đổi, các thiết bị khác đang đăng nhập tài khoản này sẽ bị đăng xuất.</p>
      </div>
      <FormField label="Mật khẩu hiện tại" id="currentPassword" type="password" autoComplete="current-password"
        value={form.currentPassword} onChange={onText} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-4">
          <FormField label="Mật khẩu mới" id="newPassword" type="password" autoComplete="new-password"
            value={form.newPassword} onChange={onText} required />
          <PasswordStrength value={form.newPassword} />
        </div>
        <FormField label="Nhập lại mật khẩu mới" id="confirm" type="password" autoComplete="new-password"
          value={form.confirm} onChange={onText} required />
      </div>
      {error && <p className="alert-error">{error}</p>}
      <button type="submit" disabled={saving} className="btn btn-primary">
        {saving ? "Đang lưu..." : "Đổi mật khẩu"}
      </button>
    </form>
  );
}
