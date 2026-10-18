import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getPlansApi, checkoutApi, simulatePaymentApi } from "../../api/billing";
import { PAYMENT_METHOD_LABELS, PLAN_LABELS, PLAN_RANK, formatVND } from "../../utils/labels";
import BackButton from "../../components/BackButton";
import qrImage from "../../assets/qr_fb.png";

const QR_BY_METHOD = {
  bank_transfer: qrImage,
  momo: qrImage,
  zalopay: qrImage,
  vnpay: qrImage,
};

const btn = "rounded-lg px-4 py-2 font-medium disabled:opacity-60";

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
    } catch (err) {
      setError(err.response?.data?.message || "Không thể kết nối máy chủ");
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) return <p>Đang tải...</p>;
  if (!plan) {
    return (
      <div className="mx-auto max-w-4xl space-y-3">
        <p className="rounded-lg bg-red-50 px-3 py-2 text-red-600 dark:bg-red-950 dark:text-red-300">
          {error || "Không tìm thấy gói này."}
        </p>
        <BackButton to="/pricing">Quay lại bảng giá</BackButton>
      </div>
    );
  }

  const errorBox = error && (
    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">{error}</p>
  );

  /* ---- Bước 3: kết quả ---- */
  if (stage === "done") {
    const ok = payment.status === "success";
    return (
      <div className="mx-auto max-w-4xl space-y-4 rounded-2xl border border-gray-200 p-6 text-center dark:border-gray-700">
        <p className="text-5xl">{ok ? "✅" : "❌"}</p>
        <h1 className="text-xl font-bold">{ok ? `Đã kích hoạt gói ${plan.name}` : "Thanh toán chưa hoàn tất"}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Mã giao dịch: {payment.transactionRef}</p>
        <div className="flex justify-center gap-3">
          {ok ? (
            <Link to="/billing" className={`${btn} bg-indigo-600 text-white hover:bg-indigo-700`}>Xem gói của tôi</Link>
          ) : (
            <button onClick={() => { setStage("select"); setPayment(null); }} className={`${btn} bg-indigo-600 text-white hover:bg-indigo-700`}>
              Thử lại
            </button>
          )}
          <Link to="/pricing" className={`${btn} border border-gray-300 dark:border-gray-600`}>Bảng giá</Link>
        </div>
      </div>
    );
  }

  /* ---- Bước 2: cổng thanh toán giả lập ---- */
  
if (stage === "gateway") {
    const qrSrc = QR_BY_METHOD[payment.method];

  return (
    <div className="mx-auto max-w-4xl space-y-4 rounded-2xl border-2 border-dashed border-yellow-500 p-6">
      <p className="rounded-lg bg-yellow-100 px-3 py-2 text-center text-sm font-semibold text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
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
            <p className="text-gray-500 dark:text-gray-400">
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
              className={`${btn} border border-gray-300 dark:border-gray-600`}
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
              className="h-54 w-54 rounded-lg bg-white p-2"
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

      <div className="space-y-2 rounded-2xl border border-gray-200 p-5 dark:border-gray-700">
        <h1 className="text-xl font-bold">{renew ? "Gia hạn" : "Nâng cấp"} gói {plan.name}</h1>
        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
          {formatVND(plan.price)}<span className="text-sm font-normal text-gray-500">/30 ngày</span>
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Gói hiện tại: {PLAN_LABELS[user.currentPlan]}. {lower ? "Bạn đang dùng gói cao hơn, chưa thể mua gói này." : note}
        </p>
      </div>

      <div className="space-y-2 rounded-2xl border border-gray-200 p-5 dark:border-gray-700">
        <h2 className="font-semibold">Phương thức thanh toán</h2>
        {METHOD_ORDER.map((value) => (
          <label key={value} className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
            <input type="radio" name="method" value={value} checked={method === value} onChange={() => setMethod(value)} className="accent-indigo-600" />
            {PAYMENT_METHOD_LABELS[value]}
          </label>
        ))}
      </div>

      {errorBox}
      <button disabled={busy || lower} onClick={startPayment} className={`${btn} w-full bg-indigo-600 py-3 text-white hover:bg-indigo-700`}>
        {busy ? "Đang tạo giao dịch..." : `Tiếp tục thanh toán ${formatVND(plan.price)}`}
      </button>
    </div>
  );
}