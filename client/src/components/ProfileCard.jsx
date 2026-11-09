import { Link, useLocation, useNavigationType } from "react-router-dom";
import Avatar from "./Avatar";
import ScoreBadge from "./ScoreBadge";
import Icon from "./Icon";
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

  // Màu theo điểm tương thích: cao xanh lá, trung bình vàng, thấp hồng
  const scoreTone = item.match.score >= 80 ? "score-high" : item.match.score >= 60 ? "score-mid" : "score-low";

  const sub = [item.age && `${item.age} tuổi`, GENDER_LABELS[item.gender], item.school || item.occupation]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      to={`/matching/${item.userId}`}
      data-card-id={item.userId}
      onClick={() => saveLastViewed(item.userId)}
      data-tilt
      data-spotlight
      className={`card card-link score-glow ${scoreTone} relative flex flex-col overflow-hidden p-5 ${isLastViewed ? "last-viewed" : ""}`}
    >
      <span className="score-bar" aria-hidden="true" />
      <div className="flex items-start gap-3">
        <span className="score-ring shrink-0">
          <Avatar src={item.avatarUrl} name={item.displayName} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">{item.displayName}</h3>
          <p className="truncate text-sm text-muted">{sub}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1">
        <ScoreBadge score={item.match.score} />
        {!item.match.compatible && (
          <span className="text-xs text-rose-600 dark:text-rose-400">Không đạt tiêu chí bắt buộc</span>
        )}
        {RELATION_TEXT[item.relation?.status] && (
          <span className="text-xs font-medium text-indigo-700 dark:text-brand">
            {RELATION_TEXT[item.relation.status]}
          </span>
        )}
      </div>

      {item.bio && <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">{item.bio}</p>}

      <div className="mt-auto flex flex-wrap gap-2 pt-4 text-xs">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-subtle px-2.5 py-1"><Icon name="wallet" size={13} className="text-brand" />{formatBudget(item.budget)}</span>
        {item.locations.slice(0, 3).map((l) => (
          <span key={l} className="inline-flex items-center gap-1.5 rounded-full bg-subtle px-2.5 py-1"><Icon name="pin" size={13} className="text-brand" />{l}</span>
        ))}
      </div>
    </Link>
  );
}