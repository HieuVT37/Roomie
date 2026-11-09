import Icon from "./Icon";

// Khung chờ tải dạng thẻ (dùng cho lưới phòng, pass, hồ sơ)
export function CardSkeletons({ count = 6, variant = "media" }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Đang tải">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card overflow-hidden">
          {variant === "media" ? (
            <>
              <div className="skeleton aspect-[4/3] !rounded-none" />
              <div className="space-y-2.5 p-5">
                <div className="skeleton h-5 w-1/3" />
                <div className="skeleton h-4 w-4/5" />
                <div className="skeleton h-3.5 w-1/2" />
              </div>
            </>
          ) : (
            <div className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                <div className="skeleton h-14 w-14 !rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-1/2" />
                  <div className="skeleton h-3.5 w-3/4" />
                </div>
              </div>
              <div className="skeleton h-6 w-32 !rounded-full" />
              <div className="skeleton h-3.5 w-full" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Khung chờ tải cho trang chi tiết
export function DetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Đang tải">
      <div className="skeleton h-9 w-40" />
      <div className="skeleton aspect-[4/3] w-full !rounded-[1.25rem] sm:aspect-[16/9]" />
      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <div className="space-y-3">
          <div className="skeleton h-8 w-2/3" />
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-40 w-full" />
        </div>
        <div className="skeleton h-48 w-full" />
      </div>
    </div>
  );
}

// Trạng thái rỗng: icon + lời nhắn + hành động (tùy chọn)
export function EmptyState({ icon = "search", children, action }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-subtle text-brand">
        <Icon name={icon} size={22} />
      </span>
      <p className="max-w-sm text-muted">{children}</p>
      {action}
    </div>
  );
}
