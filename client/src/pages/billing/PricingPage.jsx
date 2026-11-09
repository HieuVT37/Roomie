import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPlansApi } from "../../api/billing";
import { useAuth } from "../../context/AuthContext";
import PlanCards from "../../components/PlanCards";
import Icon from "../../components/Icon";

const NOTES = [
  { icon: "check", text: "Nâng cấp có hiệu lực ngay, gói cũ được thay bằng gói mới." },
  { icon: "check", text: "Mua lại đúng gói đang dùng sẽ gia hạn thêm 30 ngày." },
  { icon: "shield", text: "Đăng tin cho thuê phòng còn yêu cầu tài khoản được cấp quyền chủ trọ." },
];

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

  return (
    <div className="space-y-12">
      <div className="enter mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold text-indigo-700 dark:text-brand">Gói dịch vụ</p>
        <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Chọn gói hợp với cách bạn tìm người ở cùng</h1>
        <p className="mt-4 text-lg text-muted">Bắt đầu miễn phí với Basic. Plus và Pro mở thêm lượt kết nối, lượt xem hồ sơ và tin đăng.</p>
      </div>

      {loading && <p className="text-center text-muted">Đang tải...</p>}
      {error && <p className="alert-error">{error}</p>}

      <PlanCards plans={plans} user={user} />

      <div className="card grid gap-4 p-6 sm:p-7 md:grid-cols-3">
        {NOTES.map((n) => (
          <p key={n.text} className="flex items-start gap-3 text-sm leading-6 text-muted">
            <span className="mt-0.5 text-brand"><Icon name={n.icon} size={18} /></span>
            {n.text}
          </p>
        ))}
      </div>

      <p className="text-center text-sm text-muted">
        Còn thắc mắc?{" "}
        <Link to="/help" className="font-medium text-indigo-700 underline-offset-4 hover:underline dark:text-brand">Xem câu hỏi thường gặp</Link>
      </p>
    </div>
  );
}
