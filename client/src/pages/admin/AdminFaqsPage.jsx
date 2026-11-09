import { useEffect, useState } from "react";
import { adminFaqsApi, adminCreateFaqApi, adminUpdateFaqApi, adminDeleteFaqApi } from "../../api/admin";
import FormField from "../../components/FormField";
import { SelectField, CheckField } from "../../components/FormControls";
import { FAQ_CATEGORY_LABELS, toOptions } from "../../utils/labels";

const emptyForm = { id: null, question: "", answer: "", category: "account", order: 0, isPublished: true };

export default function AdminFaqsPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    adminFaqsApi()
      .then((res) => active && setItems(res.items))
      .catch((err) => active && setError(err.response?.data?.message || "Không thể kết nối máy chủ"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const set = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const onText = (e) => set(e.target.name, e.target.value);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const payload = {
      question: form.question.trim(),
      answer: form.answer.trim(),
      category: form.category,
      order: Number(form.order) || 0,
      isPublished: form.isPublished,
    };
    try {
      if (form.id) await adminUpdateFaqApi(form.id, payload);
      else await adminCreateFaqApi(payload);
      setForm(emptyForm);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể kết nối máy chủ");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Xóa câu hỏi này?")) return;
    setError("");
    try {
      await adminDeleteFaqApi(id);
      if (form.id === id) setForm(emptyForm);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể kết nối máy chủ");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Hỗ trợ (FAQ)</h1>

      <form onSubmit={submit} className="space-y-4 card p-5 sm:p-6">
        <h2 className="font-semibold">{form.id ? "Sửa câu hỏi" : "Thêm câu hỏi mới"}</h2>
        <FormField label="Câu hỏi" id="question" value={form.question} onChange={onText} required minLength={5} maxLength={300} />
        <div>
          <label htmlFor="answer" className="label">Câu trả lời</label>
          <textarea id="answer" name="answer" rows={4} value={form.answer} onChange={onText} required maxLength={3000}
            className="input" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField label="Danh mục" id="category" value={form.category} onChange={onText} options={toOptions(FAQ_CATEGORY_LABELS)} />
          <FormField label="Thứ tự (số nhỏ hiện trước)" id="order" type="number" min="0" max="999" value={form.order} onChange={onText} />
          <div className="flex items-end pb-2">
            <CheckField id="isPublished" label="Hiển thị công khai" checked={form.isPublished} onChange={(v) => set("isPublished", v)} />
          </div>
        </div>
        {error && <p className="alert-error">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="btn btn-primary">
            {saving ? "Đang lưu..." : form.id ? "Lưu thay đổi" : "Thêm câu hỏi"}
          </button>
          {form.id && (
            <button type="button" onClick={() => setForm(emptyForm)} className="btn btn-secondary">Hủy sửa</button>
          )}
        </div>
      </form>

      {loading && <div className="skeleton h-40" aria-busy="true" aria-label="Đang tải" />}
      <ul className="space-y-3">
        {items.map((f) => (
          <li key={f.id} className="flex flex-wrap items-start justify-between gap-3 card p-5 sm:p-6">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-muted dark:bg-gray-700">{FAQ_CATEGORY_LABELS[f.category]}</span>
                <span className="text-xs text-gray-500">#{f.order}</span>
                {!f.isPublished && <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">Đang ẩn</span>}
              </div>
              <p className="font-medium">{f.question}</p>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{f.answer}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setForm({ ...f }); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="btn btn-secondary btn-sm">Sửa</button>
              <button onClick={() => remove(f.id)}
                className="btn btn-sm border-red-200 bg-surface text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40">Xóa</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}