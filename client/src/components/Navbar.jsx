import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { PLAN_LABELS } from "../utils/labels";

const linkClass = ({ isActive }) =>
  isActive ? "font-semibold text-indigo-600 dark:text-indigo-400" : "hover:text-indigo-600 dark:hover:text-indigo-400";

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-gray-200 bg-white/90 px-6 py-4 backdrop-blur dark:border-gray-700 dark:bg-gray-900/90">
      <Link to="/" className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
        Roomie
      </Link>

      <nav className="flex flex-wrap gap-x-5 gap-y-1">
        {!isAdmin && <NavLink to="/matching" className={linkClass}>Matching</NavLink>}
        <NavLink to="/accommodation" end className={linkClass}>Tìm phòng</NavLink>
        <NavLink to="/pass" className={linkClass}>Pass</NavLink>
        {user && !isAdmin && (
          <>
            <NavLink to="/connections" className={linkClass}>Kết nối</NavLink>
            <NavLink to="/messages" className={linkClass}>Tin nhắn</NavLink>
            <NavLink to="/favorites" className={linkClass}>Yêu thích</NavLink>
            {user.isLandlord && <NavLink to="/my-listings" className={linkClass}>Tin của tôi</NavLink>}
          </>
        )}
        <NavLink to="/pricing" className={linkClass}>Gói dịch vụ</NavLink>
        <NavLink to="/help" className={linkClass}>Hỗ trợ</NavLink>
        {isAdmin && <NavLink to="/admin" className={linkClass}>⚙️ Quản trị</NavLink>}
      </nav>

      <div className="ml-auto flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="rounded-lg border border-gray-300 px-3 py-1 text-sm dark:border-gray-600"
        >
          {theme === "dark" ? "☀️ Sáng" : "🌙 Tối"}
        </button>

        {user ? (
          <>
            <Link
              to="/billing"
              title="Gói của bạn"
              className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
            >
              {PLAN_LABELS[user.currentPlan] || user.currentPlan}
            </Link>
            <NavLink to="/profile" className={linkClass}>
              {profile?.displayName || user.email}
            </NavLink>
            <button
              onClick={handleLogout}
              className="rounded-lg bg-gray-900 px-3 py-1 text-sm text-white dark:bg-gray-100 dark:text-gray-900"
            >
              Đăng xuất
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className={linkClass}>Đăng nhập</NavLink>
            <Link to="/register" className="rounded-lg bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-700">
              Đăng ký
            </Link>
          </>
        )}
      </div>
    </header>
  );
}