import Icon from "./Icon";

export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Phân trang" className="flex items-center justify-center gap-3">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="btn btn-secondary btn-sm">
        <Icon name="chevronLeft" size={16} />
        Trước
      </button>
      <span className="min-w-[5.5rem] text-center text-sm tabular-nums text-muted">
        Trang <span className="font-semibold text-ink">{page}</span>/{pages}
      </span>
      <button disabled={page >= pages} onClick={() => onChange(page + 1)} className="btn btn-secondary btn-sm">
        Sau
        <Icon name="chevronRight" size={16} />
      </button>
    </nav>
  );
}
