import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAccommodationApi, createAccommodationApi, updateAccommodationApi } from "../../api/accommodations";
import FormField from "../../components/FormField";
import ImageUploader from "../../components/ImageUploader";
import { SelectField, CheckField } from "../../components/FormControls";
import { AMENITIES, ROOM_TYPE_LABELS, toOptions } from "../../utils/labels";

const emptyForm = {
  title: "", description: "", city: "Hà Nội", district: "", ward: "", street: "",
  price: "", deposit: "", area: "", roomType: "single", maxOccupants: "2",
  amenities: [], electricity: "", water: "", internet: "", otherCost: "",
  images: [], rentalTerms: "", availableFrom: "", contactPhone: "",
};

const fromListing = (l) => ({
  ...emptyForm,
  title: l.title || "",
  description: l.description || "",
  city: l.address?.city || "Hà Nội",
  district: l.address?.district || "",
  ward: l.address?.ward || "",
  street: l.address?.street || "",
  price: l.price ?? "",
  deposit: l.deposit ?? "",
  area: l.area ?? "",
  roomType: l.roomType || "single",
  maxOccupants: l.maxOccupants ?? "",
  amenities: l.amenities || [],
  electricity: l.extraCosts?.electricity ?? "",
  water: l.extraCosts?.water ?? "",
  internet: l.extraCosts?.internet ?? "",
  otherCost: l.extraCosts?.other || "",
  images: l.images || [],
  rentalTerms: l.rentalTerms || "",
  availableFrom: l.availableFrom ? l.availableFrom.slice(0, 10) : "",
  contactPhone: "",
});

const num = (v) => (v === "" || v === null ? undefined : Number(v));

const toPayload = (f) => ({
  title: f.title.trim(),
  description: f.description,
  address: { city: f.city.trim(), district: f.district.trim(), ward: f.ward.trim(), street: f.street.trim() },
  price: Number(f.price),
  deposit: num(f.deposit),
  area: num(f.area),
  roomType: f.roomType,
  maxOccupants: num(f.maxOccupants),
  amenities: f.amenities,
  extraCosts: {
    electricity: num(f.electricity),
    water: num(f.water),
    internet: num(f.internet),
    other: f.otherCost,
  },
  images: f.images,
  rentalTerms: f.rentalTerms,
  availableFrom: f.availableFrom || null,
  contactPhone: f.contactPhone.trim() || null,
});

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

export default function AccommodationFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editing) return;
    let active = true;
    getAccommodationApi(id)
      .then((res) => {
        if (!active) return;
        if (!res.isOwner) {
          setError("Bạn không có quyền sửa tin này");
          return;
        }
        setForm({ ...fromListing(res.listing), contactPhone: res.contactPhone || "" });
      })
      .catch((err) => active && setError(err.response?.data?.message || "Không tải được tin"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id, editing]);

  const set = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const onText = (e) => set(e.target.name, e.target.value);
  const toggleAmenity = (a) =>
    set("amenities", form.amenities.includes(a) ? form.amenities.filter((x) => x !== a) : [...form.amenities, a]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = toPayload(form);
      const { listing } = editing ? await updateAccommodationApi(id, payload) : await createAccommodationApi(payload);
      navigate(`/accommodation/${listing.id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể kết nối máy chủ");
      setSaving(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (!editing && !user.isLandlord) {
    return (
      <div className="mx-auto max-w-xl space-y-3 rounded-2xl border border-gray-200 p-6 dark:border-gray-700">
        <h1 className="text-xl font-bold">Chưa thể đăng tin</h1>
        <p>Tài khoản của bạn chưa được cấp quyền đăng tin cho thuê. Quyền này do quản trị viên cấp cho chủ trọ.</p>
        <Link to="/accommodation" className="text-indigo-600 hover:underline dark:text-indigo-400">← Quay lại tìm phòng</Link>
      </div>
    );
  }
  if (loading) return <p>Đang tải...</p>;

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">{editing ? "Chỉnh sửa tin cho thuê" : "Đăng tin cho thuê"}</h1>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">{error}</p>}

      <Section title="Thông tin chính">
        <FormField label="Tiêu đề" id="title" value={form.title} onChange={onText} required minLength={5} maxLength={150}
          placeholder="Phòng trọ khép kín 25m², gần ĐH Ngoại thương" />
        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium">Mô tả</label>
          <textarea id="description" name="description" rows={5} value={form.description} onChange={onText} className={textareaClass} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Loại phòng" id="roomType" value={form.roomType} onChange={onText} options={toOptions(ROOM_TYPE_LABELS)} />
          <FormField label="Diện tích (m²)" id="area" type="number" min="1" step="0.5" value={form.area} onChange={onText} />
          <FormField label="Giá thuê (VNĐ/tháng)" id="price" type="number" min="0" step="100000" value={form.price} onChange={onText} required />
          <FormField label="Tiền cọc (VNĐ)" id="deposit" type="number" min="0" step="100000" value={form.deposit} onChange={onText} />
          <FormField label="Số người tối đa" id="maxOccupants" type="number" min="1" max="20" value={form.maxOccupants} onChange={onText} />
          <FormField label="Có thể dọn vào từ" id="availableFrom" type="date" value={form.availableFrom} onChange={onText} />
        </div>
      </Section>

      <Section title="Địa chỉ">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Thành phố" id="city" value={form.city} onChange={onText} required />
          <FormField label="Quận/huyện" id="district" value={form.district} onChange={onText} required placeholder="Cầu Giấy" />
          <FormField label="Phường/xã" id="ward" value={form.ward} onChange={onText} />
          <FormField label="Số nhà, đường, ngõ" id="street" value={form.street} onChange={onText} />
        </div>
      </Section>

      <Section title="Hình ảnh">
        <ImageUploader images={form.images} onChange={(imgs) => set("images", imgs)} />
      </Section>

      <Section title="Tiện nghi">
        <div className="grid gap-3 sm:grid-cols-3">
          {AMENITIES.map((a) => (
            <CheckField key={a} id={`am-${a}`} label={a} checked={form.amenities.includes(a)} onChange={() => toggleAmenity(a)} />
          ))}
        </div>
      </Section>

      <Section title="Chi phí và điều khoản">
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Giá điện (VNĐ/kWh)" id="electricity" type="number" min="0" value={form.electricity} onChange={onText} />
          <FormField label="Giá nước (VNĐ)" id="water" type="number" min="0" value={form.water} onChange={onText} />
          <FormField label="Internet (VNĐ/tháng)" id="internet" type="number" min="0" value={form.internet} onChange={onText} />
        </div>
        <FormField label="Chi phí khác" id="otherCost" value={form.otherCost} onChange={onText} placeholder="Phí vệ sinh 30k/tháng" />
        <div>
          <label htmlFor="rentalTerms" className="mb-1 block text-sm font-medium">Điều khoản thuê</label>
          <textarea id="rentalTerms" name="rentalTerms" rows={3} value={form.rentalTerms} onChange={onText} className={textareaClass} />
        </div>
        <FormField label="Số điện thoại / Zalo liên hệ" id="contactPhone" value={form.contactPhone} onChange={onText} placeholder="0900000000" />
      </Section>

      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="flex-1 rounded-lg bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
          {saving ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Đăng tin"}
        </button>
        <button type="button" onClick={() => navigate(-1)} className="rounded-lg border border-gray-300 px-6 py-3 dark:border-gray-600">
          Hủy
        </button>
      </div>
    </form>
  );
}