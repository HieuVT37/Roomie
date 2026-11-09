import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getPlansApi, checkoutApi, simulatePaymentApi } from "../../api/billing";
import { PAYMENT_METHOD_LABELS, PLAN_LABELS, PLAN_RANK, formatVND } from "../../utils/labels";
import BackButton from "../../components/BackButton";
import qrImage from "../../assets/qr_fb.png";
import Icon from "../../components/Icon";
import { confetti } from "../../components/fx/confetti";
import { toast } from "../../components/fx/Toaster";

const QR_BY_METHOD = {
  bank_transfer: qrImage,
  momo: qrImage,
  zalopay: qrImage,
  vnpay: qrImage,
};

const btn = "btn";

// Chuyển khoản ngân hàng đứng đầu danh sách
const METHOD_ORDER = ["bank_transfer", "momo", "vnpay", "zalopay"];

export default function CheckoutPage() {
  const { planCode } = useParams();
  const { user, refreshUser } = useAuth();

  const [plan, setPlan] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [method, setMethod] = useState("bank_transfer");
  const [stage, setStage] = useState("select"); // select | gateway | done
  const [payment, setPayment] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getPlansApi()
      .then((res) => active && setPlan(res.plans.find((p) => p.code === planCode && p.price > 0) || null))
      .catch((err) => active && setError(err.response?.data?.message || "Không thể kết nối máy chủ"))
      .finally(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, [planCode]);

  const startPayment = async () => {
    setBusy(true);
    setError("");
    try {
      const data = await checkoutApi(planCode, method);
      setPayment(data.payment);
      setStage("gateway");
    } catch (err) {
      setError(err.response?.data?.message || "Không thể kết nối máy chủ");
    } finally {
      setBusy(false);
    }
  };

  const finish = async (result) => {
    setBusy(true);
    setError("");
    try {
      const data = await simulatePaymentApi(payment.id, result);
      if (data.payment.status === "success") await refreshUser();
      setPayment(data.payment);
      setStage("done");
      if (data.payment.status === "success") {
        confetti({ count: 140 });
        toast("Thanh toán thành công, gói đã được kích hoạt");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Không thể kết nối máy chủ");
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) return <div className="skeleton h-64" aria-busy="true" aria-label="Đang tải" />;
  if (!plan) {
    return (
      <div className="mx-auto max-w-4xl space-y-3">
        <p className="alert-error">
          {error || "Không tìm thấy gói này."}
        </p>
        <BackButton to="/pricing">Quay lại bảng giá</BackButton>
      </div>
    );
  }

  const errorBox = error && (
    <p className="alert-error">{error}</p>
  );

  /* ---- Bước 3: kết quả ---- */
  if (stage === "done") {
    const ok = payment.status === "success";
    return (
      <div className="card enter mx-auto max-w-xl space-y-4 p-8 text-center sm:p-10">
        <span className={`pop mx-auto flex h-16 w-16 items-center justify-center rounded-full ${ok
          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
          : "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"}`}>
          <Icon name={ok ? "check" : "plus"} size={30} className={ok ? "" : "rotate-45"} />
        </span>
        <h1 className="text-2xl font-semibold">{ok ? `Đã kích hoạt gói ${plan.name}` : "Thanh toán chưa hoàn tất"}</h1>
        <p className="text-sm text-muted">Mã giao dịch: {payment.transactionRef}</p>
        <div className="flex justify-center gap-3">
          {ok ? (
            <Link to="/billing" className={`${btn} btn-primary`}>Xem gói của tôi</Link>
          ) : (
            <button onClick={() => { setStage("select"); setPayment(null); }} className={`${btn} btn-primary`}>
              Thử lại
            </button>
          )}
          <Link to="/pricing" className={`${btn} btn-secondary`}>Bảng giá</Link>
        </div>
      </div>
    );
  }

  /* ---- Bước 2: cổng thanh toán giả lập ---- */
  
if (stage === "gateway") {
    const qrSrc = QR_BY_METHOD[payment.method];

  return (
    <div className="mx-auto max-w-4xl space-y-4 rounded-2xl border-2 border-dashed border-yellow-500 p-6">
      <p className="rounded-[var(--radius-control)] border border-amber-200 bg-amber-50 px-3 py-2 text-center text-sm font-semibold text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
        CỔNG THANH TOÁN GIẢ LẬP · chế độ thử nghiệm, không trừ tiền thật
      </p>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-6">
        {/* Nội dung bên trái */}
        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="mb-4 text-xl font-bold">
            {PAYMENT_METHOD_LABELS[payment.method]}
          </h1>

          <div className="space-y-1 text-sm">
            <p>Gói: <b>{plan.name}</b></p>
            <p>Số tiền: <b>{formatVND(payment.amount)}</b></p>
            <p>Mã giao dịch: <b>{payment.transactionRef}</b></p>
            <p className="text-muted">
              Giao dịch hết hạn sau 15 phút.
            </p>
          </div>

          {errorBox}

          {/* Ba nút nằm sát ngay dưới nội dung */}
          <div className="mt-auto flex flex-wrap gap-2 pt-4">
            <button
              disabled={busy}
              onClick={() => finish("success")}
              className={`${btn} bg-green-600 text-white hover:bg-green-700`}
            >
              Thanh toán thành công
            </button>

            <button
              disabled={busy}
              onClick={() => finish("failed")}
              className={`${btn} bg-red-600 text-white hover:bg-red-700`}
            >
              Thanh toán thất bại
            </button>

            <button
              disabled={busy}
              onClick={() => finish("cancel")}
              className={`${btn} btn-secondary`}
            >
              Hủy giao dịch
            </button>
          </div>
        </div>

         {qrSrc && (
          <div className="flex shrink-0 items-start justify-center sm:justify-end">
            <img
              src={qrSrc}
              alt={`Mã QR ${PAYMENT_METHOD_LABELS[payment.method]}`}
              className="h-54 w-54 rounded-xl bg-white p-2 shadow-[var(--shadow-soft)]"
            />
          </div>
        )}
      </div>
    </div>
  );
}


  /* ---- Bước 1: chọn phương thức ---- */
  const renew = plan.code === user.currentPlan;
  const lower = PLAN_RANK[plan.code] < PLAN_RANK[user.currentPlan];
  const note = renew
    ? "Gói được cộng thêm 30 ngày kể từ ngày hết hạn hiện tại."
    : "Gói mới có hiệu lực ngay và thay thế gói hiện tại. Thời gian còn lại của gói cũ không được hoàn lại.";

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <BackButton to="/pricing">Quay lại bảng giá</BackButton>

      <div className="space-y-2 card p-5 sm:p-6">
        <h1 className="text-2xl font-semibold">{renew ? "Gia hạn" : "Nâng cấp"} gói {plan.name}</h1>
        <p className="text-3xl font-semibold tabular-nums text-indigo-700 dark:text-brand">
          {formatVND(plan.price)}<span className="text-sm font-normal text-gray-500">/30 ngày</span>
        </p>
        <p className="text-sm text-muted">
          Gói hiện tại: {PLAN_LABELS[user.currentPlan]}. {lower ? "Bạn đang dùng gói cao hơn, chưa thể mua gói này." : note}
        </p>
      </div>

      <div className="space-y-2 card p-5 sm:p-6">
        <h2 className="font-semibold">Phương thức thanh toán</h2>
        {METHOD_ORDER.map((value) => (
          <label key={value} className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-control)] border border-line bg-surface px-4 py-3 transition-colors hover:border-indigo-300 has-[:checked]:border-brand has-[:checked]:bg-subtle">
            <input type="radio" name="method" value={value} checked={method === value} onChange={() => setMethod(value)} className="accent-indigo-600" />
            {PAYMENT_METHOD_LABELS[value]}
          </label>
        ))}
      </div>

      {errorBox}
      <button disabled={busy || lower} onClick={startPayment} className={`${btn} btn-primary h-12 w-full text-base`}>
        {busy ? "Đang tạo giao dịch..." : `Tiếp tục thanh toán ${formatVND(plan.price)}`}
      </button>
    </div>
  );
}