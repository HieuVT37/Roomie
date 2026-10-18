import { NavLink, Outlet } from "react-router-dom";

const ITEMS = [
  { to: "/admin", label: "📊 Tổng quan", end: true },
  { to: "/admin/users", label: "👥 Người dùng" },
  { to: "/admin/moderation", label: "✅ Duyệt tin" },
  { to: "/admin/reports", label: "🚩 Báo cáo" },
  { to: "/admin/plans", label: "💳 Gói dịch vụ" },
  { to: "/admin/faqs", label: "❓ Hỗ trợ (FAQ)" },
];

const linkClass = ({ isActive }) =>
  `block rounded-lg px-3 py-2 text-sm ${isActive
    ? "bg-indigo-600 font-semibold text-white"
    : "hover:bg-gray-100 dark:hover:bg-gray-800"}`;

export default function AdminLayout() {
  return (
    <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[200px_1fr]">
      <aside className="h-fit space-y-1 rounded-2xl border border-gray-200 p-3 dark:border-gray-700">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Quản trị</p>
        {ITEMS.map((i) => (
          <NavLink key={i.to} to={i.to} end={i.end} className={linkClass}>{i.label}</NavLink>
        ))}
      </aside>
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  );
}