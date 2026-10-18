import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import FormField from "../../components/FormField";

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({ displayName: "", email: "", password: "", confirm: "" });
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
      await register({
        displayName: form.displayName,
        email: form.email,
        password: form.password,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Không thể kết nối máy chủ");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-md rounded-2xl border border-gray-200 p-6 shadow-sm dark:border-gray-700">
      <h1 className="mb-1 text-2xl font-bold">Tạo tài khoản</h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Bắt đầu tìm bạn cùng phòng phù hợp</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Tên hiển thị" id="displayName" value={form.displayName} onChange={handleChange} required />
        <FormField label="Email" id="email" type="email" value={form.email} onChange={handleChange} required />
        <FormField label="Mật khẩu (tối thiểu 8 ký tự, có chữ và số)" id="password" type="password" value={form.password} onChange={handleChange} required />
        <FormField label="Nhập lại mật khẩu" id="confirm" type="password" value={form.confirm} onChange={handleChange} required />

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? "Đang tạo tài khoản..." : "Đăng ký"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        Đã có tài khoản?{" "}
        <Link to="/login" className="text-indigo-600 hover:underline dark:text-indigo-400">Đăng nhập</Link>
      </p>
    </div>
  );
}