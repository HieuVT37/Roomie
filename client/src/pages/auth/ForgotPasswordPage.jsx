import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPasswordApi, resetPasswordApi } from "../../api/auth";
import AuthShell from "../../components/AuthShell";
import FormField from "../../components/FormField";
import { OtpField, ResendButton } from "../../components/OtpField";
import PasswordStrength from "../../components/fx/PasswordStrength";
import { toast } from "../../components/fx/Toaster";

// Quên mật khẩu: bước 1 nhập email để nhận mã, bước 2 nhập mã + mật khẩu mới
export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState("email"); // "email" | "reset"
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false); // email chưa có tài khoản
  const [submitting, setSubmitting] = useState(false);

  const requestCode = async (e) => {
    e.preventDefault();
    setError("");
    setNotFound(false);
    setSubmitting(true);
    try {
      await forgotPasswordApi(email);
      setStep("reset");
    } catch (err) {
      setNotFound(err.response?.data?.code === "EMAIL_NOT_FOUND");
      setError(err.response?.data?.message || "Không thể kết nối máy chủ");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Mật khẩu nhập lại không khớp");
      return;
    }
    setSubmitting(true);
    try {
      await resetPasswordApi({ email, code, password });
      toast("Đã đặt lại mật khẩu, hãy đăng nhập bằng mật khẩu mới");
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Không thể kết nối máy chủ");
      setSubmitting(false);
    }
  };

  const backToLogin = (
    <>
      Nhớ ra mật khẩu?{" "}
      <Link to="/login" className="font-medium text-indigo-700 underline-offset-4 hover:underline dark:text-brand">Đăng nhập</Link>
    </>
  );

  if (step === "email") {
    return (
      <AuthShell title="Quên mật khẩu" subtitle="Nhập email đăng ký, Roomie sẽ gửi mã OTP để bạn đặt lại mật khẩu" footer={backToLogin}>
        <form onSubmit={requestCode} className="space-y-5">
          <FormField floating label="Email" id="email" type="email" value={email}
            onChange={(e) => { setEmail(e.target.value); setNotFound(false); }} required autoComplete="email" />
          {error && (
            <div className="alert-error space-y-2">
              <p>{error}</p>
              {/* Email chưa đăng ký: mời đăng ký luôn bằng email vừa nhập */}
              {notFound && (
                <Link to="/register" state={{ email }}
                  className="inline-block font-semibold underline underline-offset-4">
                  Đăng ký tài khoản bằng email này
                </Link>
              )}
            </div>
          )}
          <button type="submit" disabled={submitting} className="btn btn-primary h-12 w-full text-base">
            {submitting ? "Đang gửi mã..." : "Gửi lại mã OTP"}
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Đặt lại mật khẩu"
      subtitle={`Mã OTP đã được gửi tới ${email} (kiểm tra cả mục Spam).`}
      footer={backToLogin}
    >
      <form onSubmit={reset} className="space-y-5">
        <OtpField value={code} onChange={setCode} />
        <FormField floating label="Mật khẩu mới (tối thiểu 8 ký tự, có chữ và số)" id="password" type="password"
          value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
        <PasswordStrength value={password} />
        <FormField floating label="Nhập lại mật khẩu mới" id="confirm" type="password"
          value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" />

        {error && <p className="alert-error">{error}</p>}

        <button type="submit" disabled={submitting || code.length !== 6} className="btn btn-primary h-12 w-full text-base">
          {submitting ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
        </button>
        <ResendButton onResend={() => forgotPasswordApi(email)} />
        <button type="button" onClick={() => { setStep("email"); setError(""); setCode(""); }}
          className="w-full text-center text-sm text-muted underline-offset-4 hover:underline">
          Dùng email khác
        </button>
      </form>
    </AuthShell>
  );
}
