import { Link, useLocation, useNavigationType } from "react-router-dom";
import FavoriteButton from "./FavoriteButton";
import ImageFrame from "./ImageFrame";
import {
  PASS_TYPE_LABELS, PASS_STATUS_LABELS, ITEM_CATEGORY_LABELS, CONDITION_LABELS, passPriceText,
} from "../utils/labels";
import { saveLastViewed, readLastViewed, isReturningTo } from "../utils/lastViewed";

export default function PassCard({ item, onFavoriteChange, showFavorite = true }) {
  const { pathname, search } = useLocation();
  const navType = useNavigationType();
  const isLastViewed =
    isReturningTo(pathname + search, navType) && readLastViewed()?.id === String(item.id);

  const cover = item.images?.[0];
  const sub =
    item.type === "room"
      ? [item.roomInfo?.remainingLeaseMonths != null && `Còn ${item.roomInfo.remainingLeaseMonths} tháng HĐ`, item.area]
      : [ITEM_CATEGORY_LABELS[item.itemInfo?.category], CONDITION_LABELS[item.itemInfo?.condition], item.area];

  return (
    <Link
      to={`/pass/${item.id}`}
      data-card-id={item.id}
      onClick={() => saveLastViewed(item.id)}
      className={`relative block overflow-hidden rounded-2xl border transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
        isLastViewed
          ? "border-indigo-400 shadow-[0_0_0_3px_rgba(129,140,248,0.25),0_0_18px_rgba(129,140,248,0.45)]"
          : "border-gray-200 dark:border-gray-700"
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-800">
        {cover ? (
          <ImageFrame src={cover} alt={item.title} fallback={item.type === "room" ? "🏠" : "📦"} />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">{item.type === "room" ? "🏠" : "📦"}</div>
        )}
      </div>

      <span className="absolute left-2 top-2 z-10 rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-medium text-white">
        {PASS_TYPE_LABELS[item.type]}
      </span>

      {showFavorite && (
        <div className="absolute right-2 top-2 z-10">
          <FavoriteButton listingId={item.id} initial={item.isFavorite} onToggle={onFavoriteChange} targetType="pass" />
        </div>
      )}

      <div className="space-y-1 p-4">
        <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{passPriceText(item)}</p>
        <h3 className="line-clamp-2 font-medium">{item.title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{sub.filter(Boolean).join(" · ")}</p>
        {item.status !== "active" && (
          <span className="inline-block rounded-full bg-gray-200 px-2 py-0.5 text-xs dark:bg-gray-700">
            {PASS_STATUS_LABELS[item.status]}
          </span>
        )}
      </div>
    </Link>
  );
}