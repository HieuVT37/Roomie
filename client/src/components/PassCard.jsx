import { Link } from "react-router-dom";
import FavoriteButton from "./FavoriteButton";
import {
  PASS_TYPE_LABELS, PASS_STATUS_LABELS, ITEM_CATEGORY_LABELS, CONDITION_LABELS, passPriceText,
} from "../utils/labels";

export default function PassCard({ item, onFavoriteChange, showFavorite = true }) {
  const cover = item.images?.[0];
  const sub =
    item.type === "room"
      ? [item.roomInfo?.remainingLeaseMonths != null && `Còn ${item.roomInfo.remainingLeaseMonths} tháng HĐ`, item.area]
      : [ITEM_CATEGORY_LABELS[item.itemInfo?.category], CONDITION_LABELS[item.itemInfo?.condition], item.area];

  return (
    <Link
      to={`/pass/${item.id}`}
      className="relative block overflow-hidden rounded-2xl border border-gray-200 transition hover:shadow-md dark:border-gray-700"
    >
      <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-800">
        {cover ? (
          <img src={cover} alt={item.title} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">{item.type === "room" ? "🏠" : "📦"}</div>
        )}
      </div>

      <span className="absolute left-2 top-2 rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-medium text-white">
        {PASS_TYPE_LABELS[item.type]}
      </span>

      {showFavorite && (
        <div className="absolute right-2 top-2">
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