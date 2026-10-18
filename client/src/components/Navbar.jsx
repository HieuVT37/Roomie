import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNotifications } from "../context/NotificationContext";
import { PLAN_LABELS } from "../utils/labels";
import CountBadge from "./CountBadge";
import Avatar from "./Avatar";

const linkClass = ({ isActive }) =>
  isActive ? "font-semibold text-indigo-600 dark:text-indigo-400" : "hover:text-indigo-600 dark:hover:text-indigo-400";

// Menu trên banner (từ 768px) và menu ở đáy màn hình (điện thoại) dùng đệm khác nhau
const rowItemClass = (state) => `${linkClass(state)} block whitespace-nowrap py-2 text-base`;
const barItemClass = (state) => `${linkClass(state)} block px-1 py-2.5 text-center text-base leading-tight`;

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const unread = useNotifications();
  const isAdmin = user?.role === "admin";
  const displayName = profile?.displayName || user?.email || "";

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const links = [
    !isAdmin && { to: "/matching", label: "Matching" },
    { to: "/accommodation", label: "Tìm phòng", end: true },
    { to: "/pass", label: "Pass" },
    user && !isAdmin && { to: "/connections", label: "Kết nối", badge: "connections" },
    user && !isAdmin && { to: "/messages", label: "Tin nhắn", badge: "messages" },
    user && !isAdmin && { to: "/favorites", label: "Yêu thích" },

    { to: "/pricing", label: "Gói dịch vụ" },
    { to: "/help", label: "Hỗ trợ" },
    isAdmin && { to: "/admin", label: "⚙️ Quản trị" },
  ].filter(Boolean);

  const renderItems = (itemClass, liClass) =>
    links.map((l) => (
      <li key={l.to} className={liClass}>
        <NavLink to={l.to} end={l.end} className={itemClass}>
          <span className="relative inline-block">
            {l.label}
            {l.badge && <CountBadge count={unread[l.badge]} />}
          </span>
        </NavLink>
      </li>
    ));

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-gray-700 dark:bg-gray-900/90 sm:px-6 sm:py-4">
        {/* max-w-6xl: cùng chiều rộng với các khối nội dung bên dưới */}
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 max-md:flex-nowrap xl:flex-nowrap">
          <Link to="/" className="order-1 text-lg font-bold text-indigo-600 dark:text-indigo-400">
            Roomie
          </Link>

          {/* Menu: ẩn ở điện thoại; 768px–1279px nằm ở hàng thứ hai; từ 1280px nằm cùng một dòng giữa logo và Đăng xuất */}
          <nav aria-label="Menu chính" className="order-3 hidden w-full md:block xl:order-2 xl:w-auto xl:flex-1">
            <ul className="flex w-full items-center justify-between xl:justify-evenly xl:gap-x-2">
              {renderItems(rowItemClass, "shrink-0")}
            </ul>
          </nav>

          <div className="order-2 ml-auto flex items-center gap-2 md:gap-3 xl:order-3 xl:ml-0">
            <button
              onClick={toggleTheme}
              aria-label="Đổi giao diện sáng hoặc tối"
              className="rounded-lg border border-gray-300 px-3 py-1 text-sm dark:border-gray-600"
            >
              <span aria-hidden="true">{theme === "dark" ? "☀️" : "🌙"}</span>
              <span className="ml-1 hidden md:inline">{theme === "dark" ? "Sáng" : "Tối"}</span>
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

                {/* Điện thoại: chỉ ảnh đại diện (chữ cái đầu nếu chưa có ảnh); từ 768px: tên đầy đủ */}
                <Link to="/profile" title={displayName} className="md:hidden">
                  <Avatar src={profile?.avatarUrl} name={displayName} size={32} />
                </Link>
                <NavLink
                  to="/profile"
                  title={displayName}
                  className={(state) => `${linkClass(state)} hidden max-w-[10rem] truncate text-sm md:block xl:max-w-[7rem]`}
                >
                  {displayName}
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
        </div>
      </header>

      {/* Thanh menu cố định ở đáy màn hình (chỉ điện thoại): tự xuống dòng, mỗi dòng 5 mục, không cuộn ngang.
          Đặt NGOÀI <header> để "fixed" tính theo màn hình */}
      <nav
        aria-label="Menu chính (điện thoại)"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden dark:border-gray-700 dark:bg-gray-900/95"
      >
        <ul className="flex flex-wrap justify-center px-1 py-1">
          {renderItems(barItemClass, "basis-1/4")}
        </ul>
      </nav>
    </>
  );
}