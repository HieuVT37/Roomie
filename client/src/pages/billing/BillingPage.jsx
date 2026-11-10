import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { myBillingApi } from "../../api/billing";
import { PLAN_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, formatVND } from "../../utils/labels";
import { EmptyState } from "../../components/ListStates";

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
      <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
        <div className={`bar-grow h-2 rounded-full ${color}`} style={{ width: `${unsupported ? 0 : pct}%` }} />
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

  if (error) return <p className="alert-error">{error}</p>;
  if (!data) return <div className="skeleton h-64" aria-busy="true" aria-label="Đang tải" />;

  const { plan, subscription, limits, usage, payments } = data;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-3xl font-semibold">Gói dịch vụ của tôi</h1>

      <section className="card enter flex flex-wrap items-center justify-between gap-4 p-6 sm:p-7">
        <div>
          <p className="text-sm text-muted">Gói hiện tại</p>
          <p className="text-3xl font-semibold tabular-nums text-indigo-700 dark:text-brand">{PLAN_LABELS[plan]}</p>
          {subscription ? (
            <p className="text-sm text-muted">
              Hết hạn {new Date(subscription.expiresAt).toLocaleDateString("vi-VN")} (còn {subscription.daysLeft} ngày)
            </p>
          ) : (
            <p className="text-sm text-muted">Không giới hạn thời gian</p>
          )}
        </div>
        <Link to="/pricing" className="btn btn-primary">
          {plan === "basic" ? "Nâng cấp gói" : "Gia hạn / đổi gói"}
        </Link>
      </section>

      <section className="space-y-4 card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Mức sử dụng</h2>
        <UsageBar label="Yêu cầu kết nối tháng này" used={usage.connectionRequests} limit={limits.maxConnectionRequestsPerMonth} />
        <UsageBar label="Hồ sơ đã xem hôm nay" used={usage.matchViewsToday} limit={limits.maxMatchViewsPerDay} />
        <UsageBar label="Nhận xét AI tháng này" used={usage.aiInsightsThisMonth ?? 0} limit={limits.maxAiInsightsPerMonth ?? 0} />
        <UsageBar label="Bài Pass đang đăng" used={usage.passListings} limit={limits.maxActivePassListings} />
        <UsageBar label="Tin cho thuê đang hiển thị" used={usage.accommodationListings}
          limit={limits.maxActiveAccommodationListings} unsupported={!limits.canPostAccommodation} />
      </section>

      <section className="space-y-3 card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Lịch sử thanh toán</h2>
        {payments.length === 0 ? (
          <EmptyState icon="card">Chưa có giao dịch nào.</EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Gói</th>
                  <th>Số tiền</th>
                  <th>Phương thức</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>{new Date(p.createdAt).toLocaleString("vi-VN")}</td>
                    <td>{PLAN_LABELS[p.planCode]}</td>
                    <td>{formatVND(p.amount)}</td>
                    <td>{PAYMENT_METHOD_LABELS[p.method]}</td>
                    <td className={`font-medium ${STATUS_COLOR[p.status]}`}>{PAYMENT_STATUS_LABELS[p.status]}</td>
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