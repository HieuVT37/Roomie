import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getPassApi, createPassApi, updatePassApi } from "../../api/pass";
import FormField from "../../components/FormField";
import ImageUploader from "../../components/ImageUploader";
import { SelectField, CheckField } from "../../components/FormControls";
import {
  PASS_TYPE_LABELS, ITEM_CATEGORY_LABELS, CONDITION_LABELS, DEAL_LABELS, toOptions,
} from "../../utils/labels";

const emptyForm = {
  type: "item", title: "", description: "", price: "", area: "", contact: "", images: [],
  address: "", deposit: "", remainingLeaseMonths: "", availableFrom: "", landlordAgreed: false, transferTerms: "",
  category: "furniture", condition: "good", dealType: "sell",
};

const fromListing = (l, contact) => ({
  ...emptyForm,
  type: l.type,
  title: l.title || "",
  description: l.description || "",
  price: l.price ?? "",
  area: l.area || "",
  contact: contact || "",
  images: l.images || [],
  address: l.roomInfo?.address || "",
  deposit: l.roomInfo?.deposit ?? "",
  remainingLeaseMonths: l.roomInfo?.remainingLeaseMonths ?? "",
  availableFrom: l.roomInfo?.availableFrom ? l.roomInfo.availableFrom.slice(0, 10) : "",
  landlordAgreed: Boolean(l.roomInfo?.landlordAgreed),
  transferTerms: l.roomInfo?.transferTerms || "",
  category: l.itemInfo?.category || "furniture",
  condition: l.itemInfo?.condition || "good",
  dealType: l.itemInfo?.dealType || "sell",
});

const num = (v) => (v === "" || v === null ? undefined : Number(v));

const toPayload = (f) => {
  const payload = {
    type: f.type,
    title: f.title.trim(),
    description: f.description,
    area: f.area.trim(),
    contact: f.contact.trim() || null,
    images: f.images,
    price: f.type === "item" && f.dealType === "give_away" ? 0 : f.price === "" ? null : Number(f.price),
  };
  if (f.type === "room") {
    payload.roomInfo = {
      address: f.address.trim(),
      deposit: num(f.deposit),
      remainingLeaseMonths: num(f.remainingLeaseMonths),
      availableFrom: f.availableFrom || null,
      landlordAgreed: f.landlordAgreed,
      transferTerms: f.transferTerms,
    };
  } else {
    payload.itemInfo = { category: f.category, condition: f.condition, dealType: f.dealType };
  }
  return payload;
};

const textareaClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-800";

function Section({ title, children }) {
  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 p-5 dark:border-gray-700">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function PassFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ ...emptyForm, type: params.get("type") === "room" ? "room" : "item" });
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editing) return;
    let active = true;
    getPassApi(id)
      .then((res) => {
        if (!active) return;
        if (!res.isOwner) {
          setError("Bạn không có quyền sửa bài này");
          return;
        }
        setForm(fromListing(res.listing, res.contact));
      })
      .catch((err) => active && setError(err.response?.data?.message || "Không tải được bài đăng"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id, editing]);

  const set = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const onText = (e) => set(e.target.name, e.target.value);
  const isRoom = form.type === "room";
  const isGiveAway = !isRoom && form.dealType === "give_away";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = toPayload(form);
      const { listing } = editing ? await updatePassApi(id, payload) : await createPassApi(payload);
      navigate(`/pass/${listing.id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể kết nối máy chủ");
      setSaving(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (loading) return <p>Đang tải...</p>;

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">{editing ? "Chỉnh sửa bài Pass" : "Đăng bài Pass"}</h1>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">{error}</p>}

      {!editing && (
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(PASS_TYPE_LABELS).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => set("type", value)}
              className={`rounded-2xl border-2 p-4 text-center font-medium ${form.type === value
                ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950"
                : "border-gray-200 dark:border-gray-700"}`}
            >
              {value === "room" ? "🏠" : "📦"} {label}
            </button>
          ))}
        </div>
      )}

      <Section title="Thông tin chính">
        <FormField label="Tiêu đề" id="title" value={form.title} onChange={onText} required minLength={3} maxLength={150}
          placeholder={isRoom ? "Pass phòng trọ 20m², còn 5 tháng hợp đồng" : "Bàn học gỗ + ghế, còn mới 90%"} />
        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium">Mô tả</label>
          <textarea id="description" name="description" rows={4} value={form.description} onChange={onText} className={textareaClass} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {isRoom ? (
            <FormField label="Giá thuê (VNĐ/tháng)" id="price" type="number" min="0" step="100000" value={form.price} onChange={onText} required />
          ) : (
            <FormField label={isGiveAway ? "Giá (cho tặng nên là 0)" : "Giá (để trống nếu thỏa thuận)"} id="price"
              type="number" min="0" step="10000" value={isGiveAway ? 0 : form.price} onChange={onText} disabled={isGiveAway} />
          )}
          <FormField label="Khu vực" id="area" value={form.area} onChange={onText} placeholder="Thanh Xuân, Hà Nội" />
        </div>
        <FormField label="Thông tin liên hệ (chỉ người đã đăng nhập mới thấy)" id="contact" value={form.contact} onChange={onText} placeholder="Zalo: 0900000000" />
      </Section>

      {isRoom ? (
        <Section title="Thông tin phòng">
          <FormField label="Địa chỉ phòng" id="address" value={form.address} onChange={onText} required />
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Tiền cọc (VNĐ)" id="deposit" type="number" min="0" step="100000" value={form.deposit} onChange={onText} />
            <FormField label="Hợp đồng còn lại (tháng)" id="remainingLeaseMonths" type="number" min="0" max="120" value={form.remainingLeaseMonths} onChange={onText} required />
            <FormField label="Bàn giao từ ngày" id="availableFrom" type="date" value={form.availableFrom} onChange={onText} />
          </div>
          <CheckField id="landlordAgreed" label="Chủ nhà đã đồng ý cho chuyển nhượng"
            hint="Nên xác nhận với chủ nhà trước khi đăng để tránh tranh chấp"
            checked={form.landlordAgreed} onChange={(v) => set("landlordAgreed", v)} />
          <div>
            <label htmlFor="transferTerms" className="mb-1 block text-sm font-medium">Điều khoản chuyển nhượng</label>
            <textarea id="transferTerms" name="transferTerms" rows={3} value={form.transferTerms} onChange={onText} className={textareaClass}
              placeholder="Bên nhận chuyển lại phần tiền cọc cho bên pass..." />
          </div>
        </Section>
      ) : (
        <Section title="Thông tin món đồ">
          <div className="grid gap-4 sm:grid-cols-3">
            <SelectField label="Danh mục" id="category" value={form.category} onChange={onText} options={toOptions(ITEM_CATEGORY_LABELS)} />
            <SelectField label="Tình trạng" id="condition" value={form.condition} onChange={onText} options={toOptions(CONDITION_LABELS)} />
            <SelectField label="Hình thức" id="dealType" value={form.dealType} onChange={onText} options={toOptions(DEAL_LABELS)} />
          </div>
        </Section>
      )}

      <Section title="Hình ảnh">
        <ImageUploader images={form.images} onChange={(imgs) => set("images", imgs)} />
      </Section>

      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="flex-1 rounded-lg bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
          {saving ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Đăng bài"}
        </button>
        <button type="button" onClick={() => navigate(-1)} className="rounded-lg border border-gray-300 px-6 py-3 dark:border-gray-600">
          Hủy
        </button>
      </div>
    </form>
  );
}