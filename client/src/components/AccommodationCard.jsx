import { Link } from "react-router-dom";
import FavoriteButton from "./FavoriteButton";
import { ROOM_TYPE_LABELS, LISTING_STATUS_LABELS, formatVND } from "../utils/labels";

export default function AccommodationCard({ item, onFavoriteChange, showFavorite = true }) {
  const cover = item.images?.[0];
  const sub = [item.address?.district, item.area && `${item.area} m²`, ROOM_TYPE_LABELS[item.roomType]]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      to={`/accommodation/${item.id}`}
      className="relative block overflow-hidden rounded-2xl border border-gray-200 transition hover:shadow-md dark:border-gray-700"
    >
      <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-800">
        {cover ? (
          <img src={cover} alt={item.title} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">🏠</div>
        )}
      </div>

      {showFavorite && (
        <div className="absolute right-2 top-2">
          <FavoriteButton listingId={item.id} initial={item.isFavorite} onToggle={onFavoriteChange} />
        </div>
      )}

      <div className="space-y-1 p-4">
        <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
          {formatVND(item.price)}
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">/tháng</span>
        </p>
        <h3 className="line-clamp-2 font-medium">{item.title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{sub}</p>
        {item.status !== "available" && (
          <span className="inline-block rounded-full bg-gray-200 px-2 py-0.5 text-xs dark:bg-gray-700">
            {LISTING_STATUS_LABELS[item.status]}
          </span>
        )}
      </div>
    </Link>
  );
}