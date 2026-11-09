import { useState } from "react";

// Nhãn "Mới" có chấm xanh "thở" cho tin đăng trong 24 giờ gần nhất
const DAY = 24 * 60 * 60 * 1000;

export default function NewBadge({ createdAt }) {
  const [now] = useState(() => Date.now()); // lấy thời điểm một lần khi thẻ được tạo
  if (!createdAt || now - new Date(createdAt).getTime() > DAY) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-[var(--shadow-soft)] backdrop-blur dark:bg-gray-900/80 dark:text-emerald-400">
      <span className="new-dot" aria-hidden="true" />
      Mới
    </span>
  );
}
