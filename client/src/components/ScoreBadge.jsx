// Điểm tương thích: dạng nhãn nhỏ (thẻ) hoặc vòng tròn chạy dần (large, trang chi tiết)
const tone = (score) =>
  score >= 80
    ? { pill: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300", stroke: "stroke-emerald-500" }
    : score >= 60
      ? { pill: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300", stroke: "stroke-amber-500" }
      : { pill: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300", stroke: "stroke-rose-500" };

export default function ScoreBadge({ score, large = false }) {
  const t = tone(score);

  if (large) {
    const r = 34;
    const len = 2 * Math.PI * r;
    return (
      <span className="relative inline-flex h-24 w-24 items-center justify-center" role="img" aria-label={`${score}% Compatible`}>
        <svg viewBox="0 0 80 80" className="absolute inset-0 -rotate-90">
          <circle cx="40" cy="40" r={r} fill="none" strokeWidth="6" className="stroke-gray-100 dark:stroke-gray-700" />
          <circle
            cx="40" cy="40" r={r} fill="none" strokeWidth="6" strokeLinecap="round"
            className={`ring-fill ${t.stroke}`}
            style={{ strokeDasharray: len, strokeDashoffset: len * (1 - score / 100), "--ring-len": len }}
          />
        </svg>
        <span className="text-center leading-none">
          <span className="block text-2xl font-semibold tabular-nums">{score}%</span>
          <span className="mt-1 block text-[0.625rem] font-medium uppercase tracking-wide text-muted">Compatible</span>
        </span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${t.pill}`}>
      {score}% Compatible
    </span>
  );
}
