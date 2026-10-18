export default function ScoreBadge({ score, large = false }) {
  const color =
    score >= 80
      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
      : score >= 60
        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200"
        : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200";

  return (
    <span className={`rounded-full font-semibold ${color} ${large ? "px-4 py-2 text-xl" : "px-3 py-1 text-sm"}`}>
      {score}% Compatible
    </span>
  );
}