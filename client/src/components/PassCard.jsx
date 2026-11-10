import { Link, useLocation, useNavigationType } from "react-router-dom";
import FavoriteButton from "./FavoriteButton";
import ImageFrame from "./ImageFrame";
import Icon from "./Icon";
import NewBadge from "./fx/NewBadge";
import useHoverCycle from "../hooks/useHoverCycle";
import {
  PASS_TYPE_LABELS, PASS_STATUS_LABELS, ITEM_CATEGORY_LABELS, conditionLabel, passPriceText,
} from "../utils/labels";
import { saveLastViewed, readLastViewed, isReturningTo } from "../utils/lastViewed";

export default function PassCard({ item, onFavoriteChange, showFavorite = true }) {
  const { pathname, search } = useLocation();
  const navType = useNavigationType();
  const isLastViewed =
    isReturningTo(pathname + search, navType) && readLastViewed()?.id === String(item.id);

  const images = item.images || [];
  const { index: imgIndex, bind } = useHoverCycle(images.length); // rê chuột: ảnh tự chuyển
  const sub =
    item.type === "room"
      ? [item.roomInfo?.remainingLeaseMonths != null && `Còn ${item.roomInfo.remainingLeaseMonths} tháng HĐ`, item.area]
      : [ITEM_CATEGORY_LABELS[item.itemInfo?.category], conditionLabel(item.itemInfo?.condition), item.area];

  return (
    <Link
      to={`/pass/${item.id}`}
      data-card-id={item.id}
      onClick={() => saveLastViewed(item.id)}
      data-tilt
      data-spotlight
      {...bind}
      className={`card card-link relative block overflow-hidden ${isLastViewed ? "last-viewed" : ""}`}
    >
      <ImageFrame src={images[imgIndex]} alt={item.title} fallback={item.type === "room" ? "home" : "package"} />
      {images.length > 1 && (
        <span className="card-dots" aria-hidden="true">
          {images.map((u, i) => <span key={u} className={i === imgIndex ? "on" : ""} />)}
        </span>
      )}

      <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-800 shadow-[var(--shadow-soft)] backdrop-blur dark:bg-gray-900/80 dark:text-gray-100">
          {PASS_TYPE_LABELS[item.type]}
        </span>
        <NewBadge createdAt={item.createdAt} />
      </div>

      {showFavorite && (
        <div className="absolute right-3 top-3 z-10">
          <FavoriteButton listingId={item.id} initial={item.isFavorite} onToggle={onFavoriteChange} targetType="pass" />
        </div>
      )}

      <div className="space-y-1.5 p-4 sm:p-5">
        <p className="text-lg font-semibold tabular-nums text-indigo-700 dark:text-brand">{passPriceText(item)}</p>
        <h3 className="line-clamp-2 font-medium leading-snug">{item.title}</h3>
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <Icon name={item.type === "room" ? "home" : "package"} size={14} className="shrink-0" />
          <span className="truncate">{sub.filter(Boolean).join(" · ")}</span>
        </p>
        {item.status !== "active" && (
          <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-muted dark:bg-gray-700">
            {PASS_STATUS_LABELS[item.status]}
          </span>
        )}
      </div>
    </Link>
  );
}