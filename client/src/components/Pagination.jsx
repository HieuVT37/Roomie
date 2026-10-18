export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-4">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)}
        className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">← Trước</button>
      <span className="text-sm">Trang {page}/{pages}</span>
      <button disabled={page >= pages} onClick={() => onChange(page + 1)}
        className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Sau →</button>
    </div>
  );
}