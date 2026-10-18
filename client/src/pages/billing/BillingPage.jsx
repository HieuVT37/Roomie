import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { myBillingApi } from "../../api/billing";
import { PLAN_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, formatVND } from "../../utils/labels";

const STATUS_COLOR = {
  success: "text-green-600 dark:text-green-400",
  failed: "text-red-600 dark:text-red-400",
  pending: "text-yellow-600 dark:text-yellow-400",
  refunded: "text-gray-500",
};

function UsageBar({ label, used, limit, unsupported }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const color = pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-yellow-500" : "bg-indigo-500";
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{unsupported ? "Gói hiện tại chưa hỗ trợ" : `${used}/${limit}`}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${unsupported ? 0 : pct}%` }} />
      </div>
    </div>
  );
}

export default function BillingPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    myBillingApi()
      .then((res) => active && setData(res))
      .catch((err) => active && setError(err.response?.data?.message || "Không thể kết nối máy chủ"));
    return () => {
      active = false;
    };
  }, []);

  if (error) return <p className="rounded-lg bg-red-50 px-3 py-2 text-red-600 dark:bg-red-950 dark:text-red-300">{error}</p>;
  if (!data) return <p>Đang tải...</p>;

  const { plan, subscription, limits, usage, payments } = data;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Gói dịch vụ của tôi</h1>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 p-5 dark:border-gray-700">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gói hiện tại</p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{PLAN_LABELS[plan]}</p>
          {subscription ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Hết hạn {new Date(subscription.expiresAt).toLocaleDateString("vi-VN")} (còn {subscription.daysLeft} ngày)
            </p>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Không giới hạn thời gian</p>
          )}
        </div>
        <Link to="/pricing" className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">
          {plan === "basic" ? "Nâng cấp gói" : "Gia hạn / đổi gói"}
        </Link>
      </section>

      <section className="space-y-4 rounded-2xl border border-gray-200 p-5 dark:border-gray-700">
        <h2 className="text-lg font-semibold">Mức sử dụng</h2>
        <UsageBar label="Yêu cầu kết nối tháng này" used={usage.connectionRequests} limit={limits.maxConnectionRequestsPerMonth} />
        <UsageBar label="Hồ sơ đã xem hôm nay" used={usage.matchViewsToday} limit={limits.maxMatchViewsPerDay} />
        <UsageBar label="Bài Pass đang đăng" used={usage.passListings} limit={limits.maxActivePassListings} />
        <UsageBar label="Tin cho thuê đang hiển thị" used={usage.accommodationListings}
          limit={limits.maxActiveAccommodationListings} unsupported={!limits.canPostAccommodation} />
      </section>

      <section className="space-y-3 rounded-2xl border border-gray-200 p-5 dark:border-gray-700">
        <h2 className="text-lg font-semibold">Lịch sử thanh toán</h2>
        {payments.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có giao dịch nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="py-2 pr-4">Thời gian</th>
                  <th className="py-2 pr-4">Gói</th>
                  <th className="py-2 pr-4">Số tiền</th>
                  <th className="py-2 pr-4">Phương thức</th>
                  <th className="py-2">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="py-2 pr-4">{new Date(p.createdAt).toLocaleString("vi-VN")}</td>
                    <td className="py-2 pr-4">{PLAN_LABELS[p.planCode]}</td>
                    <td className="py-2 pr-4">{formatVND(p.amount)}</td>
                    <td className="py-2 pr-4">{PAYMENT_METHOD_LABELS[p.method]}</td>
                    <td className={`py-2 font-medium ${STATUS_COLOR[p.status]}`}>{PAYMENT_STATUS_LABELS[p.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}