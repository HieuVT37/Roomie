import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminStatsApi } from "../../api/admin";
import { formatVND } from "../../utils/labels";

function Stat({ label, value, hint, to, alert }) {
  const body = (
    <div className={`h-full rounded-2xl border p-4 ${alert
      ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950"
      : "border-gray-200 dark:border-gray-700"}`}>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
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

  if (error) return <p className="rounded-lg bg-red-50 px-3 py-2 text-red-600 dark:bg-red-950 dark:text-red-300">{error}</p>;
  if (!data) return <p>Đang tải...</p>;

  const { users, accommodation, pass, revenue } = data;
  const pendingListings = accommodation.pending + pass.pending;
  const maxRevenue = Math.max(1, ...revenue.monthly.map((m) => m.revenue));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tổng quan</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Tin chờ duyệt" value={pendingListings} to="/admin/moderation" alert={pendingListings > 0}
          hint={`${accommodation.pending} tin phòng · ${pass.pending} bài Pass`} />
        <Stat label="Báo cáo cần xử lý" value={data.openReports} to="/admin/reports" alert={data.openReports > 0} />
        <Stat label="Người dùng" value={users.total} to="/admin/users"
          hint={`${users.active} đang hoạt động · +${users.newLast7d} trong 7 ngày`} />
        <Stat label="Chủ trọ" value={users.landlords} />
        <Stat label="Phòng đang cho thuê" value={accommodation.available} hint={`Tổng ${accommodation.total} tin`} />
        <Stat label="Bài Pass đang đăng" value={pass.active} />
        <Stat label="Kết nối thành công" value={data.connectionsAccepted} />
        <Stat label="Doanh thu 30 ngày" value={formatVND(revenue.last30d)} hint={`Tổng ${formatVND(revenue.total)} (${revenue.count} giao dịch)`} />
      </div>

      <section className="space-y-3 rounded-2xl border border-gray-200 p-5 dark:border-gray-700">
        <h2 className="text-lg font-semibold">Người dùng theo gói</h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          {["basic", "plus", "pro"].map((code) => (
            <div key={code} className="rounded-xl bg-gray-100 p-3 dark:bg-gray-800">
              <p className="text-2xl font-bold">{users.byPlan[code] || 0}</p>
              <p className="text-sm capitalize text-gray-500 dark:text-gray-400">{code}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-gray-200 p-5 dark:border-gray-700">
        <h2 className="text-lg font-semibold">Doanh thu 6 tháng gần nhất</h2>
        <div className="flex h-40 items-end gap-3">
          {revenue.monthly.map((m) => (
            <div key={m.month} className="flex flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[10px] text-gray-500 dark:text-gray-400">{m.revenue ? formatVND(m.revenue) : ""}</span>
              <div className="w-full rounded-t bg-indigo-500" style={{ height: `${Math.max(2, (m.revenue / maxRevenue) * 100)}%` }} />
              <span className="text-xs">{m.month.slice(5)}/{m.month.slice(2, 4)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}