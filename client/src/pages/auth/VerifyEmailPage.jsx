import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { resendVerificationApi } from "../../api/auth";
import AuthShell from "../../components/AuthShell";
import FormField from "../../components/FormField";
import { OtpField, ResendButton } from "../../components/OtpField";
import { toast } from "../../components/fx/Toaster";

// Bước 2 của đăng ký: nhập mã 6 số đã gửi về email để kích hoạt tài khoản
export default function VerifyEmailPage() {
  const { verifyEmail } = useAuth();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get("email") || "");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await verifyEmail(email, code);
      toast("Đã xác thực email, chào mừng bạn đến Roomie!");
      // GuestRoute tự chuyển trang khi đã đăng nhập
    } catch (err) {
      setError(err.response?.data?.message || "Không thể kết nối máy chủ");
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Xác thực email"
      subtitle={email ? `Nhập mã 6 số vừa gửi tới ${email}` : "Nhập email và mã 6 số đã gửi tới email của bạn"}
      footer={
        <>
          Nhập sai email?{" "}
          <Link to="/register" className="font-medium text-indigo-700 underline-offset-4 hover:underline dark:text-brand">Đăng ký lại</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {!params.get("email") && (
          <FormField floating label="Email" id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        )}
        <OtpField value={code} onChange={setCode} />

        {error && <p className="alert-error">{error}</p>}

        <button type="submit" disabled={submitting || code.length !== 6} className="btn btn-primary h-12 w-full text-base">
          {submitting ? "Đang xác thực..." : "Xác thực và đăng nhập"}
        </button>
        <ResendButton onResend={() => resendVerificationApi(email)} />
      </form>
    </AuthShell>
  );
}
