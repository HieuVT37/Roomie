import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminStatsApi } from "../../api/admin";
import { formatVND } from "../../utils/labels";
import Icon from "../../components/Icon";
import CountUp from "../../components/fx/CountUp";

function Stat({ label, value, hint, to, alert, icon, format }) {
  const body = (
    <div data-tilt data-spotlight className={`card h-full p-5 ${to ? "card-link" : ""} ${alert ? "!border-rose-300 dark:!border-rose-900" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">{label}</p>
        {icon && (
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${alert
            ? "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
            : "bg-subtle text-brand"}`}>
            <Icon name={icon} size={16} />
          </span>
        )}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
        {typeof value === "number" ? <CountUp value={value} format={format} /> : value}
      </p>
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
  return to ? <Link to={to} className="block h-full">{body}</Link> : body;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    adminStatsApi()
      .then((res) => active && setData(res))
      .catch((err) => active && setError(err.response?.data?.message || "Không thể kết nối máy chủ"));
    return () => {
      active = false;
    };
  }, []);

  if (error) return <p className="alert-error">{error}</p>;
  if (!data) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Đang tải">
        <div className="skeleton h-9 w-40" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton h-32" />)}
        </div>
        <div className="skeleton h-64" />
      </div>
    );
  }

  const { users, accommodation, pass, revenue } = data;
  const pendingListings = accommodation.pending + pass.pending;
  const maxRevenue = Math.max(1, ...revenue.monthly.map((m) => m.revenue));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Tổng quan</h1>
        <p className="mt-1 text-sm text-muted">Số liệu toàn hệ thống Roomie.</p>
      </div>

      <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Tin chờ duyệt" value={pendingListings} to="/admin/moderation" alert={pendingListings > 0} icon="checkCircle"
          hint={`${accommodation.pending} tin phòng · ${pass.pending} bài Pass`} />
        <Stat label="Báo cáo cần xử lý" value={data.openReports} to="/admin/reports" alert={data.openReports > 0} icon="flag" />
        <Stat label="Người dùng" value={users.total} to="/admin/users" icon="users"
          hint={`${users.active} đang hoạt động · +${users.newLast7d} trong 7 ngày`} />
        <Stat label="Chủ trọ" value={users.landlords} icon="user" />
        <Stat label="Phòng đang cho thuê" value={accommodation.available} icon="home" hint={`Tổng ${accommodation.total} tin`} />
        <Stat label="Bài Pass đang đăng" value={pass.active} icon="package" />
        <Stat label="Kết nối thành công" value={data.connectionsAccepted} icon="message" />
        <Stat label="Doanh thu 30 ngày" value={revenue.last30d} format={formatVND} icon="wallet" hint={`Tổng ${formatVND(revenue.total)} (${revenue.count} giao dịch)`} />
      </div>

      <section className="card space-y-5 p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Người dùng theo gói</h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          {["basic", "plus", "pro"].map((code) => (
            <div key={code} className="rounded-xl bg-subtle p-4">
              <p className="text-3xl font-semibold tabular-nums">{users.byPlan[code] || 0}</p>
              <p className="mt-1 text-sm capitalize text-muted">{code}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card space-y-5 p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Doanh thu 6 tháng gần nhất</h2>
        <div className="flex h-56 items-end gap-2 border-b border-line sm:gap-4">
          {revenue.monthly.map((m, i) => (
            <div key={m.month} className="flex flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[10px] tabular-nums text-muted sm:text-xs">{m.revenue ? formatVND(m.revenue) : ""}</span>
              {/* cột mọc lên từ đáy khi trang mở */}
              <div
                className="bar-rise w-full max-w-16 rounded-t-lg bg-gradient-to-t from-indigo-600 to-indigo-400 transition-opacity hover:opacity-80"
                style={{ height: `${Math.max(2, (m.revenue / maxRevenue) * 100)}%`, animationDelay: `${i * 110}ms` }}
                title={formatVND(m.revenue)}
              />
              <span className="pb-2 text-xs text-muted">{m.month.slice(5)}/{m.month.slice(2, 4)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}