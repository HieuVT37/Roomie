import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPlansApi } from "../../api/billing";
import { useAuth } from "../../context/AuthContext";
import { PLAN_RANK, formatVND } from "../../utils/labels";

const LIMIT_ROWS = [
  ["Yêu cầu kết nối mỗi tháng", (l) => l.maxConnectionRequestsPerMonth],
  ["Hồ sơ xem chi tiết mỗi ngày", (l) => l.maxMatchViewsPerDay],
  ["Bài Pass đang đăng", (l) => l.maxActivePassListings],
  ["Đăng tin cho thuê phòng", (l) => (l.canPostAccommodation ? `Tối đa ${l.maxActiveAccommodationListings} tin` : "Không")],
];

function PlanAction({ plan, user, currentPlan }) {
  const base = "block rounded-lg py-2 text-center font-medium";

  if (plan.code === "basic") {
    return user ? (
      <span className={`${base} bg-gray-100 text-gray-500 dark:bg-gray-800`}>
        {currentPlan === "basic" ? "Gói hiện tại" : "Gói miễn phí"}
      </span>
    ) : (
      <Link to="/register" className={`${base} border border-gray-300 dark:border-gray-600`}>Bắt đầu miễn phí</Link>
    );
  }

  if (!user) {
    return <Link to="/register" className={`${base} bg-indigo-600 text-white hover:bg-indigo-700`}>Đăng ký để nâng cấp</Link>;
  }
  if (PLAN_RANK[plan.code] < PLAN_RANK[currentPlan]) {
    return <span className={`${base} bg-gray-100 text-gray-500 dark:bg-gray-800`}>Bạn đang dùng gói cao hơn</span>;
  }
  const renew = plan.code === currentPlan;
  return (
    <Link to={`/checkout/${plan.code}`} className={`${base} bg-indigo-600 text-white hover:bg-indigo-700`}>
      {renew ? "Gia hạn thêm 30 ngày" : "Nâng cấp"}
    </Link>
  );
}

export default function PricingPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getPlansApi()
      .then((res) => active && setPlans(res.plans))
      .catch((err) => active && setError(err.response?.data?.message || "Không thể kết nối máy chủ"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const currentPlan = user?.currentPlan;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Gói dịch vụ</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Chọn gói phù hợp với nhu cầu tìm bạn cùng phòng của bạn</p>
      </div>

      {loading && <p className="text-center">Đang tải...</p>}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-red-600 dark:bg-red-950 dark:text-red-300">{error}</p>}

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.code === currentPlan;
          return (
            <div
              key={plan.code}
              className={`flex flex-col gap-4 rounded-2xl border-2 p-6 ${isCurrent
                ? "border-indigo-600"
                : "border-gray-200 dark:border-gray-700"}`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">{plan.name}</h2>
                  {isCurrent && (
                    <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs text-white">Đang dùng</span>
                  )}
                </div>
                <p className="mt-2 text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  {plan.price === 0 ? "Miễn phí" : formatVND(plan.price)}
                  {plan.price > 0 && <span className="text-sm font-normal text-gray-500">/30 ngày</span>}
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{plan.description}</p>
              </div>

              <ul className="flex-1 space-y-2 text-sm">
                {LIMIT_ROWS.map(([label, get]) => (
                  <li key={label} className="flex justify-between gap-3 border-b border-gray-100 pb-2 dark:border-gray-800">
                    <span className="text-gray-500 dark:text-gray-400">{label}</span>
                    <span className="font-medium">{get(plan.limits)}</span>
                  </li>
                ))}
              </ul>

              <PlanAction plan={plan} user={user} currentPlan={currentPlan} />
            </div>
          );
        })}
      </div>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        Đăng tin cho thuê phòng còn yêu cầu tài khoản được cấp quyền chủ trọ. Nâng cấp gói có hiệu lực ngay và gói cũ bị thay thế.
      </p>
    </div>
  );
}