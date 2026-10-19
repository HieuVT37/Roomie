import { Link, useLocation, useNavigationType } from "react-router-dom";
import Avatar from "./Avatar";
import ScoreBadge from "./ScoreBadge";
import { GENDER_LABELS, formatBudget } from "../utils/labels";
import { saveLastViewed, readLastViewed, isReturningTo } from "../utils/lastViewed";

const RELATION_TEXT = {
  sent: "Đã gửi yêu cầu",
  received: "Muốn kết nối với bạn",
  accepted: "Đã kết nối",
};

export default function ProfileCard({ item }) {
  const { pathname, search } = useLocation();
  const navType = useNavigationType();
  const isLastViewed =
    isReturningTo(pathname + search, navType) && readLastViewed()?.id === String(item.userId);

  const sub = [item.age && `${item.age} tuổi`, GENDER_LABELS[item.gender], item.school || item.occupation]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      to={`/matching/${item.userId}`}
      data-card-id={item.userId}
      onClick={() => saveLastViewed(item.userId)}
      className={`block rounded-2xl border p-4 transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
        isLastViewed
          ? "border-indigo-400 shadow-[0_0_0_3px_rgba(129,140,248,0.25),0_0_18px_rgba(129,140,248,0.45)]"
          : "border-gray-200 dark:border-gray-700"
      }`}
    >
      {/* toàn bộ nội dung bên trong giữ nguyên */}
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