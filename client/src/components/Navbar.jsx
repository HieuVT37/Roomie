import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNotifications } from "../context/notificationStore";
import { PLAN_LABELS } from "../utils/labels";
import CountBadge from "./CountBadge";
import Avatar from "./Avatar";
import Icon from "./Icon";
import { switchThemeWithRipple } from "./fx/themeRipple";

const linkClass = ({ isActive }) =>
  isActive
    ? "font-semibold text-brand"
    : "text-muted transition-colors hover:text-ink";

// Menu trên banner (từ 768px): dạng "viên thuốc", mục đang mở có nền xanh nhạt
const rowItemClass = (state) =>
  `${linkClass(state)} block whitespace-nowrap rounded-full px-3 py-1.5 text-[0.9375rem] ${
    state.isActive ? "bg-subtle" : "hover:bg-subtle"
  }`;
// Menu ở đáy màn hình (điện thoại): vạch xanh phía trên mục đang mở
const barItemClass = (state) =>
  `${linkClass(state)} relative block px-1 py-2.5 text-center text-sm leading-tight ${
    state.isActive ? "before:absolute before:inset-x-4 before:top-0 before:h-0.5 before:rounded-full before:bg-brand" : ""
  }`;

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const unread = useNotifications();
  const isAdmin = user?.role === "admin";
  const displayName = profile?.displayName || user?.email || "";

  // Đổi sáng/tối: giọt nước rơi xuống nút, giao diện mới lan ra như gợn sóng
  const switchTheme = (e) => switchThemeWithRipple(e, toggleTheme, theme !== "dark");

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
    isAdmin && { to: "/admin", label: "Quản trị", icon: "settings" },
  ].filter(Boolean);

  const renderItems = (itemClass, liClass) =>
    links.map((l) => (
      <li key={l.to} className={liClass}>
        <NavLink to={l.to} end={l.end} className={itemClass}>
          <span className="relative inline-flex items-center gap-1.5">
            {l.icon && <Icon name={l.icon} size={16} />}
            {l.label}
            {l.badge && <CountBadge count={unread[l.badge]} />}
          </span>
        </NavLink>
      </li>
    ));

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-surface/85 backdrop-blur-md supports-[backdrop-filter]:bg-surface/75">
        {/* Cùng lề trái/phải với nội dung và chân trang (.container-page) */}
        <div className="container-page flex flex-wrap items-center gap-x-6 gap-y-1 py-3 max-md:flex-nowrap xl:flex-nowrap">
          <Link to="/" className="order-1 flex shrink-0 items-center gap-2 rounded-lg text-lg font-semibold tracking-tight text-ink">
            <img src="/roomie-logo.svg" alt="" width="30" height="30" className="rounded-[0.5rem]" />
            Roomie
          </Link>

          {/* Menu: ẩn ở điện thoại; 768px–1279px nằm ở hàng thứ hai; từ 1280px nằm cùng một dòng giữa logo và Đăng xuất */}
          <nav aria-label="Menu chính" className="order-3 -mx-3 hidden w-full md:block xl:order-2 xl:mx-0 xl:w-auto xl:flex-1">
            <ul className="flex w-full items-center justify-between xl:justify-center xl:gap-x-0.5">
              {renderItems(rowItemClass, "shrink-0")}
            </ul>
          </nav>

          <div className="order-2 ml-auto flex items-center gap-2 md:gap-3 xl:order-3 xl:ml-0">
            <button
              onClick={switchTheme}
              aria-label="Đổi giao diện sáng hoặc tối"
              title={theme === "dark" ? "Giao diện sáng" : "Giao diện tối"}
              className="btn btn-ghost btn-sm h-10 w-10 !px-0"
            >
              <Icon name={theme === "dark" ? "sun" : "moon"} />
            </button>

            {user ? (
              <>
                <Link
                  to="/billing"
                  title="Gói của bạn"
                  className="rounded-full border border-indigo-200 bg-subtle px-2.5 py-0.5 text-xs font-semibold text-indigo-700 transition-colors hover:border-indigo-300 dark:border-indigo-800 dark:text-brand"
                >
                  {PLAN_LABELS[user.currentPlan] || user.currentPlan}
                </Link>

                {/* Điện thoại: chỉ ảnh đại diện (chữ cái đầu nếu chưa có ảnh); từ 768px: tên đầy đủ */}
                <Link to="/profile" title={displayName} className="rounded-full md:hidden">
                  <Avatar src={profile?.avatarUrl} name={displayName} size={32} />
                </Link>
                <NavLink
                  to="/profile"
                  title={displayName}
                  className={(state) =>
                    `${linkClass(state)} hidden max-w-[10rem] items-center gap-2 text-sm md:flex xl:max-w-[9rem]`
                  }
                >
                  <Avatar src={profile?.avatarUrl} name={displayName} size={28} />
                  <span className="truncate">{displayName}</span>
                </NavLink>

                <button onClick={handleLogout} className="btn btn-secondary btn-sm" title="Đăng xuất">
                  <Icon name="logout" size={16} className="max-sm:hidden" />
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={(state) => `${linkClass(state)} whitespace-nowrap text-[0.9375rem]`}>Đăng nhập</NavLink>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Thanh menu cố định ở đáy màn hình (chỉ điện thoại): tự xuống dòng, mỗi dòng 4 mục, không cuộn ngang.
          Đặt NGOÀI <header> để "fixed" tính theo màn hình */}
      <nav
        aria-label="Menu chính (điện thoại)"
        className="bottom-bar fixed inset-x-0 bottom-0 z-50 transform-gpu border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <ul className="flex flex-wrap justify-center px-1">
          {renderItems(barItemClass, "basis-1/4")}
        </ul>
      </nav>
    </>
  );
}
