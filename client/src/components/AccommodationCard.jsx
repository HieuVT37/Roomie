import { Link, useLocation, useNavigationType } from "react-router-dom";
import FavoriteButton from "./FavoriteButton";
import ImageFrame from "./ImageFrame";
import { ROOM_TYPE_LABELS, LISTING_STATUS_LABELS, formatVND } from "../utils/labels";
import { saveLastViewed, readLastViewed, isReturningTo } from "../utils/lastViewed";

export default function AccommodationCard({ item, onFavoriteChange, showFavorite = true }) {
  const { pathname, search } = useLocation();
  const navType = useNavigationType();

  // Thẻ này có phải phòng người dùng vừa bấm xem rồi quay lại không
  const isLastViewed =
    isReturningTo(pathname + search, navType) && readLastViewed()?.id === String(item.id);

  const cover = item.images?.[0];
  const sub = [item.address?.district, item.area && `${item.area} m²`, ROOM_TYPE_LABELS[item.roomType]]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      to={`/accommodation/${item.id}`}
      data-card-id={item.id}
      onClick={() => saveLastViewed(item.id)}
      className={`relative block overflow-hidden rounded-2xl border transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
        isLastViewed
          ? "border-indigo-400 shadow-[0_0_0_3px_rgba(129,140,248,0.25),0_0_18px_rgba(129,140,248,0.45)]"
          : "border-gray-200 dark:border-gray-700"
      }`}
    >
      <ImageFrame src={cover} alt={item.title} fallback="🏠" />

      {showFavorite && (
        <div className="absolute right-2 top-2 z-10">
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