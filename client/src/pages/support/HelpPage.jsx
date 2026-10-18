import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listFaqsApi } from "../../api/support";
import { FAQ_CATEGORY_LABELS } from "../../utils/labels";

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
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Hỗ trợ</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Các câu hỏi thường gặp khi sử dụng Roomie</p>
      </div>

      {loading && <p>Đang tải...</p>}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-red-600 dark:bg-red-950 dark:text-red-300">{error}</p>}
      {!loading && !error && groups.length === 0 && <p>Chưa có nội dung hỗ trợ.</p>}

      {groups.map((g) => (
        <section key={g.key} className="space-y-3">
          <h2 className="text-lg font-semibold">{g.label}</h2>
          {g.list.map((f) => (
            <details key={f.id} className="group rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
              <summary className="cursor-pointer font-medium marker:text-indigo-600">{f.question}</summary>
              <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{f.answer}</p>
            </details>
          ))}
        </section>
      ))}

      <p className="rounded-2xl bg-gray-50 p-4 text-sm dark:bg-gray-800">
        Gặp người dùng hoặc bài đăng có dấu hiệu vi phạm? Hãy dùng nút <b>🚩 Báo cáo vi phạm</b> ngay trên hồ sơ hoặc bài đăng đó.
        Xem thêm <Link to="/pricing" className="text-indigo-600 hover:underline dark:text-indigo-400">các gói dịch vụ</Link>.
      </p>
    </div>
  );
}