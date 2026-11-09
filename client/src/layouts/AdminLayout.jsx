import { useRef } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useRouteSlide } from "../hooks/useMotion";
import Icon from "../components/Icon";

const ITEMS = [
  { to: "/admin", label: "Tổng quan", icon: "chart", end: true },
  { to: "/admin/users", label: "Người dùng", icon: "users" },
  { to: "/admin/moderation", label: "Duyệt tin", icon: "checkCircle" },
  { to: "/admin/reports", label: "Báo cáo", icon: "flag" },
  { to: "/admin/plans", label: "Gói dịch vụ", icon: "card" },
  { to: "/admin/faqs", label: "Hỗ trợ (FAQ)", icon: "help" },
];

const linkClass = ({ isActive }) =>
  `flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-[var(--radius-control)] px-3 py-2 text-sm transition-colors ${isActive
    ? "bg-subtle font-semibold text-indigo-700 dark:text-brand"
    : "text-muted hover:bg-subtle hover:text-ink"}`;

export default function AdminLayout() {
  // Chỉ nội dung bên phải trượt khi đổi mục quản trị, menu đứng yên
  const contentRef = useRef(null);
  useRouteSlide(contentRef);

  return (
    <div className="grid gap-6 md:grid-cols-[13rem_1fr] lg:gap-8">
      {/* Menu quản trị: cột trái dính khi cuộn; trên điện thoại là thanh cuộn ngang */}
      <aside className="h-fit md:sticky md:top-24">
        <div className="card p-2 md:p-3">
          <p className="hidden px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-muted md:block">Quản trị</p>
          <nav aria-label="Menu quản trị" className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
            {ITEMS.map((i) => (
              <NavLink key={i.to} to={i.to} end={i.end} className={linkClass}>
                <Icon name={i.icon} size={17} />
                {i.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
      <div ref={contentRef} className="min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
