import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import FormField from "../../components/FormField";

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
    <div className="mx-auto mt-10 max-w-md rounded-2xl border border-gray-200 p-6 shadow-sm dark:border-gray-700">
      <h1 className="mb-1 text-2xl font-bold">Đăng nhập</h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Chào mừng bạn quay lại Roomie</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Email" id="email" type="email" value={form.email} onChange={handleChange} required />
        <FormField label="Mật khẩu" id="password" type="password" value={form.password} onChange={handleChange} required />

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        Chưa có tài khoản?{" "}
        <Link to="/register" className="text-indigo-600 hover:underline dark:text-indigo-400">Đăng ký</Link>
      </p>

      {/* Chỉ để thử trong giai đoạn phát triển, xóa khi nộp bài */}
      <p className="mt-6 rounded-lg bg-gray-100 p-3 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
        Tài khoản thử: linh.nguyen@example.com / Roomie@123
      </p>
    </div>
  );
}