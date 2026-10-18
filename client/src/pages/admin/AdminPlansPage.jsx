import { useEffect, useState } from "react";
import { adminPlansApi, adminUpdatePlanApi } from "../../api/admin";
import FormField from "../../components/FormField";
import { CheckField } from "../../components/FormControls";

const LIMIT_FIELDS = [
  ["maxConnectionRequestsPerMonth", "Yêu cầu kết nối / tháng"],
  ["maxMatchViewsPerDay", "Hồ sơ xem / ngày"],
  ["maxActivePassListings", "Bài Pass đang đăng"],
  ["maxActiveAccommodationListings", "Tin cho thuê đang hiển thị"],
];

const toForm = (p) => ({
  price: p.price ?? 0,
  description: p.description || "",
  isActive: p.isActive !== false,
  limits: {
    maxConnectionRequestsPerMonth: p.limits.maxConnectionRequestsPerMonth ?? 0,
    maxMatchViewsPerDay: p.limits.maxMatchViewsPerDay ?? 0,
    maxActivePassListings: p.limits.maxActivePassListings ?? 0,
    maxActiveAccommodationListings: p.limits.maxActiveAccommodationListings ?? 0,
    canPostAccommodation: Boolean(p.limits.canPostAccommodation),
  },
});

export default function AdminPlansPage() {
  const [plans, setPlans] = useState([]);
  const [forms, setForms] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [savingCode, setSavingCode] = useState("");

  useEffect(() => {
    let active = true;
    adminPlansApi()
      .then((res) => {
        if (!active) return;
        setPlans(res.plans);
        setForms(Object.fromEntries(res.plans.map((p) => [p.code, toForm(p)])));
      })
      .catch((err) => active && setError(err.response?.data?.message || "Không thể kết nối máy chủ"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const setField = (code, patch) => setForms((f) => ({ ...f, [code]: { ...f[code], ...patch } }));
  const setLimit = (code, key, value) =>
    setForms((f) => ({ ...f, [code]: { ...f[code], limits: { ...f[code].limits, [key]: value } } }));

  const save = async (code) => {
    const f = forms[code];
    setSavingCode(code);
    setError("");
    setNotice("");
    try {
      const payload = {
        description: f.description,
        isActive: f.isActive,
        limits: {
          maxConnectionRequestsPerMonth: Number(f.limits.maxConnectionRequestsPerMonth),
          maxMatchViewsPerDay: Number(f.limits.maxMatchViewsPerDay),
          maxActivePassListings: Number(f.limits.maxActivePassListings),
          maxActiveAccommodationListings: Number(f.limits.maxActiveAccommodationListings),
          canPostAccommodation: f.limits.canPostAccommodation,
        },
      };
      if (code !== "basic") payload.price = Number(f.price);
      const { plan } = await adminUpdatePlanApi(code, payload);
      setForms((all) => ({ ...all, [code]: toForm(plan) }));
      setNotice(`Đã lưu gói ${plan.name}. Hạn mức mới áp dụng ngay.`);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể kết nối máy chủ");
    } finally {
      setSavingCode("");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gói dịch vụ</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Thay đổi giá chỉ áp dụng cho giao dịch mới. Thay đổi hạn mức áp dụng ngay cho tất cả người dùng đang dùng gói đó.
      </p>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">{error}</p>}
      {notice && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">{notice}</p>}
      {loading && <p>Đang tải...</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((p) => {
          const f = forms[p.code];
          if (!f) return null;
          return (
            <section key={p.code} className="space-y-4 rounded-2xl border border-gray-200 p-5 dark:border-gray-700">
              <h2 className="text-lg font-bold">{p.name}</h2>
              <FormField label="Giá (VNĐ / 30 ngày)" id={`price-${p.code}`} type="number" min="0" step="1000"
                value={f.price} disabled={p.code === "basic"} onChange={(e) => setField(p.code, { price: e.target.value })} />
              <FormField label="Mô tả" id={`desc-${p.code}`} value={f.description}
                onChange={(e) => setField(p.code, { description: e.target.value })} />
              {LIMIT_FIELDS.map(([key, label]) => (
                <FormField key={key} label={label} id={`${key}-${p.code}`} type="number" min="0"
                  value={f.limits[key]} onChange={(e) => setLimit(p.code, key, e.target.value)} />
              ))}
              <CheckField id={`post-${p.code}`} label="Được đăng tin cho thuê phòng"
                checked={f.limits.canPostAccommodation} onChange={(v) => setLimit(p.code, "canPostAccommodation", v)} />
              {p.code !== "basic" && (
                <CheckField id={`active-${p.code}`} label="Đang bán (hiện ở bảng giá)" checked={f.isActive}
                  onChange={(v) => setField(p.code, { isActive: v })} />
              )}
              <button onClick={() => save(p.code)} disabled={savingCode === p.code}
                className="w-full rounded-lg bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
                {savingCode === p.code ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </section>
          );
        })}
      </div>
    </div>
  );
}