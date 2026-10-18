import { Link } from "react-router-dom";

export default function BackButton({ to, children = "Quay lại danh sách" }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
    >
      <span aria-hidden="true">←</span>
      {children}
    </Link>
  );
}