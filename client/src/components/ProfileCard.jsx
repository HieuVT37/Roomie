import { Link } from "react-router-dom";
import Avatar from "./Avatar";
import ScoreBadge from "./ScoreBadge";
import { GENDER_LABELS, formatBudget } from "../utils/labels";

const RELATION_TEXT = {
  sent: "Đã gửi yêu cầu",
  received: "Muốn kết nối với bạn",
  accepted: "Đã kết nối",
};

export default function ProfileCard({ item }) {
  const sub = [item.age && `${item.age} tuổi`, GENDER_LABELS[item.gender], item.school || item.occupation]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      to={`/matching/${item.userId}`}
      className="block rounded-2xl border border-gray-200 p-4 transition hover:shadow-md dark:border-gray-700"
    >
      <div className="flex items-start gap-3">
        <Avatar src={item.avatarUrl} name={item.displayName} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">{item.displayName}</h3>
          <p className="truncate text-sm text-gray-500 dark:text-gray-400">{sub}</p>
        </div>
      </div>

      <div className="mt-3">
        <ScoreBadge score={item.match.score} />
        {!item.match.compatible && (
          <span className="ml-2 text-xs text-red-500">Không đạt tiêu chí bắt buộc</span>
        )}
        {RELATION_TEXT[item.relation?.status] && (
          <span className="ml-2 text-xs text-indigo-600 dark:text-indigo-400">
            {RELATION_TEXT[item.relation.status]}
          </span>
        )}
      </div>

      {item.bio && <p className="mt-3 line-clamp-2 text-sm">{item.bio}</p>}

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-gray-100 px-2 py-1 dark:bg-gray-800">💰 {formatBudget(item.budget)}</span>
        {item.locations.slice(0, 3).map((l) => (
          <span key={l} className="rounded-full bg-gray-100 px-2 py-1 dark:bg-gray-800">📍 {l}</span>
        ))}
      </div>
    </Link>
  );
}