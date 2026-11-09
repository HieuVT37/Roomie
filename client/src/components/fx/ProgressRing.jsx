// Vòng tiến trình: vẽ dần khi xuất hiện và chạy mượt mỗi khi phần trăm thay đổi
export default function ProgressRing({ percent, size = 64, label }) {
  const r = 26;
  const len = 2 * Math.PI * r;
  const tone = percent >= 100 ? "stroke-emerald-500" : percent >= 60 ? "stroke-brand" : "stroke-amber-500";
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }} role="img" aria-label={label || `${percent}%`}>
      <svg viewBox="0 0 60 60" className="absolute inset-0 -rotate-90">
        <circle cx="30" cy="30" r={r} fill="none" strokeWidth="5" className="stroke-gray-200 dark:stroke-gray-700" />
        <circle
          cx="30" cy="30" r={r} fill="none" strokeWidth="5" strokeLinecap="round"
          className={`ring-fill ${tone} transition-[stroke-dashoffset] duration-700 ease-out-soft`}
          style={{ strokeDasharray: len, strokeDashoffset: len * (1 - percent / 100), "--ring-len": len }}
        />
      </svg>
      <span className="text-sm font-semibold tabular-nums">{percent}%</span>
    </span>
  );
}
