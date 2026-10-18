// Chấm đỏ nhỏ báo có thông báo mới
export default function RedDot({ className = "" }) {
  return (
    <span
      aria-label="Có thông báo mới"
      className={`inline-block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900 ${className}`}
    />
  );
}
