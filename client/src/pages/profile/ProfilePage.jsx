import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getMyProfileApi, updateMyProfileApi } from "../../api/profile";
import FormField from "../../components/FormField";
import ImageUploader from "../../components/ImageUploader";
import { SelectField, SliderField, CheckField } from "../../components/FormControls";
import {
  CRITERIA_LABELS, GENDER_LABELS, GUEST_LABELS, SHARED_LABELS, PATTERN_LABELS, toOptions,
} from "../../utils/labels";

const CRITERIA_KEYS = Object.keys(CRITERIA_LABELS);

const emptyForm = {
  displayName: "", avatarUrl: "", bio: "", gender: "", birthYear: "", school: "", occupation: "",
  isLookingForRoommate: false,
  roomPhotos: [],
  visibility: { school: true, occupation: true, budget: true, schedule: true, interests: true, roomPhotos: true },
  city: "Hà Nội", locations: "", budgetMin: "", budgetMax: "",
  sleepTime: "23:00", wakeTime: "07:00", pattern: "student",
  cleanliness: 3, noiseLevel: 3, privacyNeed: 3,
  guestFrequency: "sometimes", sharedSpaceUsage: "moderate", smoking: false, pets: false,
  interests: "", requirements: "",
  weights: Object.fromEntries(CRITERIA_KEYS.map((k) => [k, 3])),
  dealBreakers: [],
};

const fromProfile = (profile) => {
  const p = profile.preferences || {};
  return {
    ...emptyForm,
    displayName: profile.displayName || "",
    avatarUrl: profile.avatarUrl || "",
    bio: profile.bio || "",
    gender: profile.gender || "",
    birthYear: profile.birthYear ?? "",
    school: profile.school || "",
    occupation: profile.occupation || "",
    isLookingForRoommate: Boolean(profile.isLookingForRoommate),
    roomPhotos: profile.roomPhotos || [],
    visibility: { ...emptyForm.visibility, ...(profile.visibility || {}) },
    city: p.city || "Hà Nội",
    locations: (p.locations || []).join(", "),
    budgetMin: p.budget?.min ?? "",
    budgetMax: p.budget?.max ?? "",
    sleepTime: p.schedule?.sleepTime || "23:00",
    wakeTime: p.schedule?.wakeTime || "07:00",
    pattern: p.schedule?.pattern || "student",
    cleanliness: p.cleanliness ?? 3,
    noiseLevel: p.noiseLevel ?? 3,
    privacyNeed: p.privacyNeed ?? 3,
    guestFrequency: p.guestFrequency || "sometimes",
    sharedSpaceUsage: p.sharedSpaceUsage || "moderate",
    smoking: Boolean(p.smoking),
    pets: Boolean(p.pets),
    interests: (p.interests || []).join(", "),
    requirements: (p.requirements || []).join(", "),
    weights: { ...emptyForm.weights, ...(p.weights || {}) },
    dealBreakers: p.dealBreakers || [],
  };
};

const list = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);

const toPayload = (f) => {
  const preferences = {
    city: f.city.trim(),
    locations: list(f.locations),
    schedule: { sleepTime: f.sleepTime, wakeTime: f.wakeTime, pattern: f.pattern },
    cleanliness: f.cleanliness,
    noiseLevel: f.noiseLevel,
    privacyNeed: f.privacyNeed,
    guestFrequency: f.guestFrequency,
    sharedSpaceUsage: f.sharedSpaceUsage,
    smoking: f.smoking,
    pets: f.pets,
    interests: list(f.interests),
    requirements: list(f.requirements),
    weights: f.weights,
    dealBreakers: f.dealBreakers,
  };
  if (f.budgetMin !== "" && f.budgetMax !== "") {
    preferences.budget = { min: Number(f.budgetMin), max: Number(f.budgetMax) };
  }
  return {
    displayName: f.displayName.trim(),
    avatarUrl: f.avatarUrl.trim() || null,
    bio: f.bio,
    gender: f.gender || null,
    birthYear: f.birthYear === "" ? null : Number(f.birthYear),
    school: f.school.trim() || null,
    occupation: f.occupation.trim() || null,
    isLookingForRoommate: f.isLookingForRoommate,
    roomPhotos: f.roomPhotos,
    visibility: f.visibility,
    preferences,
  };
};

function Section({ title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-700">
      <h2 className="text-lg font-semibold">{title}</h2>
      {subtitle && <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
      <div className="mt-3 space-y-4">{children}</div>
    </section>
  );
}

export default function ProfilePage() {
  const { setProfile } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    let active = true;
    getMyProfileApi()
      .then(({ profile }) => active && setForm(fromProfile(profile)))
      .catch(() => active && setMsg({ type: "error", text: "Không tải được hồ sơ" }))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const set = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const setIn = (group, key, value) => setForm((f) => ({ ...f, [group]: { ...f[group], [key]: value } }));
  const onText = (e) => set(e.target.name, e.target.value);
  const toggleBreaker = (key) =>
    setForm((f) => ({
      ...f,
      dealBreakers: f.dealBreakers.includes(key)
        ? f.dealBreakers.filter((k) => k !== key)
        : [...f.dealBreakers, key],
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      const { profile } = await updateMyProfileApi(toPayload(form));
      setProfile(profile);
      setForm(fromProfile(profile));
      setMsg({ type: "ok", text: "Đã lưu hồ sơ" });
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Không thể kết nối máy chủ" });
    } finally {
      setSaving(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (loading) return <p>Đang tải hồ sơ...</p>;

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hồ sơ của tôi</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Thông tin này dùng để tính mức độ tương thích với người khác.{" "}
          <Link to="/matching" className="text-indigo-600 hover:underline dark:text-indigo-400">Xem gợi ý →</Link>
        </p>
      </div>

      {msg && (
        <p className={`rounded-lg px-3 py-2 text-sm ${msg.type === "ok"
          ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
          : "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300"}`}>
          {msg.text}
        </p>
      )}

      <Section title="Thông tin cơ bản">
        <FormField label="Tên hiển thị" id="displayName" value={form.displayName} onChange={onText} required />
        <FormField label="Link ảnh đại diện (tùy chọn)" id="avatarUrl" value={form.avatarUrl} onChange={onText} placeholder="https://..." />
        <div>
          <label htmlFor="bio" className="mb-1 block text-sm font-medium">Giới thiệu bản thân</label>
          <textarea
            id="bio" name="bio" rows={3} maxLength={500} value={form.bio} onChange={onText}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-800"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Giới tính" id="gender" value={form.gender} onChange={onText}
            options={toOptions(GENDER_LABELS)} placeholder="-- Chọn --" />
          <FormField label="Năm sinh" id="birthYear" type="number" value={form.birthYear} onChange={onText} placeholder="2004" />
          <FormField label="Trường học" id="school" value={form.school} onChange={onText} />
          <FormField label="Nghề nghiệp" id="occupation" value={form.occupation} onChange={onText} />
        </div>
      </Section>

      <Section title="Nhu cầu tìm bạn cùng phòng">
        <CheckField id="looking" label="Tôi đang tìm bạn cùng phòng"
          hint="Bật để hồ sơ của bạn xuất hiện trong gợi ý của người khác"
          checked={form.isLookingForRoommate} onChange={(v) => set("isLookingForRoommate", v)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Thành phố" id="city" value={form.city} onChange={onText} />
          <FormField label="Khu vực muốn ở (cách nhau bằng dấu phẩy)" id="locations" value={form.locations} onChange={onText} placeholder="Đống Đa, Cầu Giấy" />
          <FormField label="Ngân sách tối thiểu (VNĐ/tháng)" id="budgetMin" type="number" step="100000" min="0" value={form.budgetMin} onChange={onText} />
          <FormField label="Ngân sách tối đa (VNĐ/tháng)" id="budgetMax" type="number" step="100000" min="0" value={form.budgetMax} onChange={onText} />
        </div>
      </Section>

      <Section
        title="Ảnh phòng bạn đang ở"
        subtitle="Tùy chọn. Ảnh giúp người khác hình dung nơi bạn đang sống. Tránh ảnh lộ số nhà, giấy tờ hoặc khuôn mặt người khác."
      >
        <ImageUploader images={form.roomPhotos} onChange={(imgs) => set("roomPhotos", imgs)} max={6} showCover={false} />
      </Section>

      <Section title="Lịch sinh hoạt và lối sống">
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Giờ đi ngủ" id="sleepTime" type="time" value={form.sleepTime} onChange={onText} />
          <FormField label="Giờ thức dậy" id="wakeTime" type="time" value={form.wakeTime} onChange={onText} />
          <SelectField label="Kiểu lịch" id="pattern" value={form.pattern} onChange={onText} options={toOptions(PATTERN_LABELS)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SliderField id="cleanliness" label="Mức độ sạch sẽ, ngăn nắp" value={form.cleanliness}
            onChange={(v) => set("cleanliness", v)} lowLabel="Thoải mái" highLabel="Rất ngăn nắp" />
          <SliderField id="noiseLevel" label="Mức độ ồn chấp nhận" value={form.noiseLevel}
            onChange={(v) => set("noiseLevel", v)} lowLabel="Rất yên tĩnh" highLabel="Ồn được" />
          <SliderField id="privacyNeed" label="Nhu cầu riêng tư" value={form.privacyNeed}
            onChange={(v) => set("privacyNeed", v)} lowLabel="Cởi mở" highLabel="Rất cần riêng tư" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Tần suất tiếp khách" id="guestFrequency" value={form.guestFrequency} onChange={onText} options={toOptions(GUEST_LABELS)} />
          <SelectField label="Dùng không gian chung (bếp, phòng khách)" id="sharedSpaceUsage" value={form.sharedSpaceUsage} onChange={onText} options={toOptions(SHARED_LABELS)} />
        </div>
        <div className="flex gap-6">
          <CheckField id="smoking" label="Có hút thuốc" checked={form.smoking} onChange={(v) => set("smoking", v)} />
          <CheckField id="pets" label="Có/chấp nhận thú cưng" checked={form.pets} onChange={(v) => set("pets", v)} />
        </div>
        <FormField label="Sở thích (cách nhau bằng dấu phẩy)" id="interests" value={form.interests} onChange={onText} placeholder="đọc sách, yoga, nấu ăn" />
        <FormField label="Yêu cầu khi sống chung (cách nhau bằng dấu phẩy)" id="requirements" value={form.requirements} onChange={onText} placeholder="Nữ, không hút thuốc" />
      </Section>

      <Section title="Mức độ quan trọng của từng tiêu chí"
        subtitle="Kéo cao nếu bạn coi trọng tiêu chí đó. Tích 'Bắt buộc' nếu lệch nhiều thì bạn không muốn thấy người đó.">
        {CRITERIA_KEYS.map((key) => (
          <div key={key} className="grid items-center gap-3 sm:grid-cols-[1fr_auto]">
            <SliderField id={`w-${key}`} label={CRITERIA_LABELS[key]} value={form.weights[key]}
              onChange={(v) => setIn("weights", key, v)} lowLabel="Ít quan trọng" highLabel="Rất quan trọng" />
            <CheckField id={`b-${key}`} label="Bắt buộc" checked={form.dealBreakers.includes(key)} onChange={() => toggleBreaker(key)} />
          </div>
        ))}
      </Section>

      <Section title="Quyền riêng tư" subtitle="Thông tin bị ẩn vẫn được dùng để tính điểm tương thích nhưng người khác không nhìn thấy.">
        {[
          ["school", "Hiển thị trường học"],
          ["occupation", "Hiển thị nghề nghiệp"],
          ["budget", "Hiển thị ngân sách"],
          ["schedule", "Hiển thị lịch sinh hoạt"],
          ["interests", "Hiển thị sở thích"],
          ["roomPhotos", "Hiển thị ảnh phòng đang ở"],
        ].map(([key, label]) => (
          <CheckField key={key} id={`v-${key}`} label={label} checked={form.visibility[key]}
            onChange={(v) => setIn("visibility", key, v)} />
        ))}
      </Section>

      <button type="submit" disabled={saving}
        className="w-full rounded-lg bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
        {saving ? "Đang lưu..." : "Lưu hồ sơ"}
      </button>
    </form>
  );
}