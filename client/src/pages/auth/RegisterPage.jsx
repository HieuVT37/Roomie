import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import FormField from "../../components/FormField";
import AuthShell from "../../components/AuthShell";
import PasswordStrength from "../../components/fx/PasswordStrength";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  // Đến từ trang Quên mật khẩu với email chưa đăng ký: điền sẵn email đó
  const { state } = useLocation();
  const [form, setForm] = useState({ displayName: "", email: state?.email || "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Mật khẩu nhập lại không khớp");
      return;
    }

    setSubmitting(true);
    try {
      const data = await register({
        displayName: form.displayName,
        email: form.email,
        password: form.password,
      });
      // Tài khoản chờ xác thực: sang bước nhập mã 6 số đã gửi về email
      navigate(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể kết nối máy chủ");
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Tạo tài khoản"
      subtitle="Bắt đầu tìm bạn cùng phòng phù hợp"
      footer={
        <>
          Đã có tài khoản?{" "}
          <Link to="/login" className="font-medium text-indigo-700 underline-offset-4 hover:underline dark:text-brand">Đăng nhập</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <FormField floating label="Tên hiển thị" id="displayName" value={form.displayName} onChange={handleChange} required />
        <FormField floating label="Email" id="email" type="email" value={form.email} onChange={handleChange} required />
        <FormField floating label="Mật khẩu (tối thiểu 8 ký tự, có chữ và số)" id="password" type="password" value={form.password} onChange={handleChange} required />
        <PasswordStrength value={form.password} />
        <FormField floating label="Nhập lại mật khẩu" id="confirm" type="password" value={form.confirm} onChange={handleChange} required />

        {error && <p className="alert-error">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary h-12 w-full text-base"
        >
          {submitting ? "Đang tạo tài khoản..." : "Đăng ký"}
        </button>
      </form>
    </AuthShell>
  );
}
