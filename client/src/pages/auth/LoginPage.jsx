import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import FormField from "../../components/FormField";
import AuthShell from "../../components/AuthShell";

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      // GuestRoute sẽ tự chuyển trang khi user đã có
    } catch (err) {
      setError(err.response?.data?.message || "Không thể kết nối máy chủ");
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Đăng nhập"
      subtitle="Chào mừng bạn quay lại Roomie"
      footer={
        <>
          Chưa có tài khoản?{" "}
          <Link to="/register" className="font-medium text-indigo-700 underline-offset-4 hover:underline dark:text-brand">Đăng ký</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <FormField floating label="Email" id="email" type="email" value={form.email} onChange={handleChange} required />
        <FormField floating label="Mật khẩu" id="password" type="password" value={form.password} onChange={handleChange} required />

        {error && <p className="alert-error">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary h-12 w-full text-base"
        >
          {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </AuthShell>
  );
}
