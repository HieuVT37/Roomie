import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listFaqsApi } from "../../api/support";
import { FAQ_CATEGORY_LABELS } from "../../utils/labels";
import { COMPANY } from "../../config/company";
import Icon from "../../components/Icon";

export default function HelpPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    listFaqsApi()
      .then((res) => active && setItems(res.items))
      .catch((err) => active && setError(err.response?.data?.message || "Không thể kết nối máy chủ"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const groups = Object.keys(FAQ_CATEGORY_LABELS)
    .map((key) => ({ key, label: FAQ_CATEGORY_LABELS[key], list: items.filter((i) => i.category === key) }))
    .filter((g) => g.list.length > 0);

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-16">
      {/* Cột trái: giới thiệu + liên hệ, dính khi cuộn ở màn hình lớn */}
      <aside className="enter space-y-8 lg:sticky lg:top-28 lg:self-start">
        <div>
          <p className="text-sm font-semibold text-indigo-700 dark:text-brand">Hỗ trợ</p>
          <h1 className="mt-3 text-4xl font-semibold">Câu hỏi thường gặp</h1>
          <p className="mt-4 text-muted">Các câu hỏi thường gặp khi sử dụng Roomie.</p>
        </div>

        <div className="card space-y-4 p-6">
          <p className="font-semibold">Vẫn cần giúp đỡ?</p>
          <ul className="space-y-3 text-sm text-muted">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 text-brand"><Icon name="mail" size={17} /></span>
              <a href={`mailto:${COMPANY.email}`} className="link">{COMPANY.email}</a>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 text-brand"><Icon name="clock" size={17} /></span>
              {COMPANY.workingHours}
            </li>
          </ul>
        </div>
      </aside>

      <div className="space-y-10">
        {loading && <p className="text-muted">Đang tải...</p>}
        {error && <p className="alert-error">{error}</p>}
        {!loading && !error && groups.length === 0 && <p className="text-muted">Chưa có nội dung hỗ trợ.</p>}

        {groups.map((g) => (
          <section key={g.key} className="space-y-4">
            <h2 className="text-lg font-semibold">{g.label}</h2>
            <div className="card divide-y divide-[var(--line)]">
              {g.list.map((f) => (
                <details key={f.id} className="faq group">
                  <summary className="flex cursor-pointer items-start justify-between gap-4 px-5 py-4 font-medium transition-colors hover:text-brand sm:px-6">
                    {f.question}
                    <span className="faq-icon mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-subtle text-brand">
                      <Icon name="plus" size={15} />
                    </span>
                  </summary>
                  <p className="whitespace-pre-wrap px-5 pb-5 text-sm leading-7 text-muted sm:px-6">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>
        ))}

        <div className="flex items-start gap-4 rounded-2xl bg-subtle p-5 text-sm leading-6 sm:p-6">
          <span className="mt-0.5 text-brand"><Icon name="shield" size={20} /></span>
          <p>
            Gặp người dùng hoặc bài đăng có dấu hiệu vi phạm? Hãy dùng nút <b>Báo cáo vi phạm</b> ngay trên hồ sơ hoặc bài đăng đó.
            Xem thêm{" "}
            <Link to="/pricing" className="font-medium text-indigo-700 underline-offset-4 hover:underline dark:text-brand">các gói dịch vụ</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
