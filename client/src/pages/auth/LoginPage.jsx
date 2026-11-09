import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import FormField from "../../components/FormField";
import AuthShell from "../../components/AuthShell";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Cập nhật theo trạng thái mới nhất (trình duyệt tự điền nhiều ô cùng lúc không bị mất dữ liệu)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(form.email, form.password);
      // GuestRoute sẽ tự chuyển trang khi user đã có
    } catch (err) {
      // Đúng mật khẩu nhưng chưa xác thực email
      if (err.response?.data?.code === "EMAIL_NOT_VERIFIED") {
        navigate(`/verify-email?email=${encodeURIComponent(form.email)}`);
        return;
      }

      setError(err.response?.data?.message || "Không thể kết nối máy chủ");
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Đăng nhập"
      subtitle="Chào mừng bạn quay lại Roomie"
    >
      <form onSubmit={handleSubmit} className="space-y-5">

        <FormField
          floating
          label="Email"
          id="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          autoComplete="email"
          required
        />

        <FormField
          floating
          label="Mật khẩu"
          id="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          autoComplete="current-password"
          required
        />

        {error && <p className="alert-error">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary h-12 w-full text-base"
        >
          {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

        {/* Nút Đăng ký: cùng kiểu nút Đăng nhập nhưng màu nhạt hơn (nút phụ) */}
        <Link
          to="/register"
          className="btn h-12 w-full border-indigo-200 bg-indigo-100 text-base text-indigo-700 hover:bg-indigo-200 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-brand dark:hover:bg-indigo-900/60"
        >
          Đăng ký
        </Link>

        {/* Quên mật khẩu: nằm dưới nút Đăng ký */}
        <div className="text-center text-sm">
          <Link
            to="/forgot-password"
            className="whitespace-nowrap font-medium text-indigo-700 underline-offset-4 hover:underline dark:text-brand"
          >
            Quên mật khẩu?
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
