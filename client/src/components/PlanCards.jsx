import { Link } from "react-router-dom";
import { PLAN_RANK, formatVND } from "../utils/labels";
import Icon from "./Icon";
import CountUp from "./fx/CountUp";

// Bảng giá dùng chung cho Trang chủ và trang Gói dịch vụ
const LIMIT_ROWS = [
  ["Yêu cầu kết nối mỗi tháng", (l) => l.maxConnectionRequestsPerMonth],
  ["Hồ sơ xem chi tiết mỗi ngày", (l) => l.maxMatchViewsPerDay],
  ["Bài Pass đang đăng", (l) => l.maxActivePassListings],
  ["Đăng tin cho thuê phòng", (l) => (l.canPostAccommodation ? `Tối đa ${l.maxActiveAccommodationListings} tin` : "Không")],
];

function PlanAction({ plan, user, currentPlan }) {
  const base = "btn w-full";
  const muted = `${base} cursor-default border-line bg-gray-100 text-muted dark:bg-gray-800`;

  if (plan.code === "basic") {
    return user ? (
      <span className={muted}>{currentPlan === "basic" ? "Gói hiện tại" : "Gói miễn phí"}</span>
    ) : (
      <Link to="/register" className={`${base} btn-secondary`}>Bắt đầu miễn phí</Link>
    );
  }

  if (!user) {
    return <Link to="/register" className={`${base} btn-primary`}>Đăng ký để nâng cấp</Link>;
  }
  if (PLAN_RANK[plan.code] < PLAN_RANK[currentPlan]) {
    return <span className={muted}>Bạn đang dùng gói cao hơn</span>;
  }
  const renew = plan.code === currentPlan;
  return (
    <Link to={`/checkout/${plan.code}`} className={`${base} btn-primary`}>
      {renew ? "Gia hạn thêm 30 ngày" : "Nâng cấp"}
    </Link>
  );
}

export default function PlanCards({ plans, user }) {
  const currentPlan = user?.currentPlan;

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {plans.map((plan) => {
        const isCurrent = plan.code === currentPlan;
        return (
          <div
            key={plan.code}
            data-tilt
            data-spotlight
            className={`card flex flex-col p-6 sm:p-7 ${isCurrent ? "border-brand ring-1 ring-brand" : ""}`}
          >
            {plan.code === "pro" && <span className="glow-ring" aria-hidden="true" />}
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              {isCurrent && (
                <span className="rounded-full bg-subtle px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:text-brand">
                  Đang dùng
                </span>
              )}
            </div>

            <p className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-semibold tracking-tight tabular-nums">
                {plan.price === 0 ? "Miễn phí" : <CountUp value={plan.price} format={formatVND} duration={1600} />}
              </span>
              {plan.price > 0 && <span className="text-sm text-muted">/30 ngày</span>}
            </p>
            {plan.description && <p className="mt-2 text-sm leading-6 text-muted">{plan.description}</p>}

            <ul className="mt-6 flex-1 space-y-3 border-t border-line pt-6 text-sm">
              {LIMIT_ROWS.map(([label, get]) => {
                const value = get(plan.limits);
                const off = value === "Không";
                return (
                  <li key={label} className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                        off ? "bg-gray-100 text-gray-400 dark:bg-gray-800" : "bg-subtle text-brand"
                      }`}
                    >
                      <Icon name={off ? "plus" : "check"} size={13} className={off ? "rotate-45" : ""} />
                    </span>
                    <span className="flex-1 text-muted">{label}</span>
                    <span className={`font-semibold tabular-nums ${off ? "text-muted" : ""}`}>{value}</span>
                  </li>
                );
              })}
            </ul>

            <div className="mt-7">
              <PlanAction plan={plan} user={user} currentPlan={currentPlan} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
