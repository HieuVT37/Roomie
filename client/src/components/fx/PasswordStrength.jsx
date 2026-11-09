// Thanh độ mạnh mật khẩu: 4 vạch đổi màu và chạy dần theo điểm.
// Chỉ là gợi ý cho người dùng; quy tắc thật vẫn do server kiểm tra.
const LEVELS = [
  { label: "Quá ngắn", color: "bg-rose-500" },
  { label: "Yếu", color: "bg-rose-500" },
  { label: "Trung bình", color: "bg-amber-500" },
  { label: "Khá", color: "bg-sky-500" },
  { label: "Mạnh", color: "bg-emerald-500" },
];

const scoreOf = (pw) => {
  if (!pw) return -1;
  if (pw.length < 8) return 0;
  let s = 1;
  if (/[a-z]/i.test(pw) && /\d/.test(pw)) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/[^a-z0-9]/i.test(pw) || pw.length >= 12) s++;
  return s;
};

export default function PasswordStrength({ value }) {
  const score = scoreOf(value);
  if (score < 0) return null;
  const lv = LEVELS[score];
  return (
    <div className="slide-down -mt-2 space-y-1.5" aria-live="polite">
      <div className="grid grid-cols-4 gap-1.5">
        {[1, 2, 3, 4].map((n) => (
          <span key={n} className="h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <span
              className={`block h-full rounded-full ${lv.color} origin-left transition-transform duration-500 ease-out-soft`}
              style={{ transform: `scaleX(${score >= n ? 1 : 0})` }}
            />
          </span>
        ))}
      </div>
      <p className="text-xs text-muted">Độ mạnh mật khẩu: <span className="font-semibold text-ink">{lv.label}</span></p>
    </div>
  );
}
