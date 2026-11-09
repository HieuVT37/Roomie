import { Link, useLocation, useNavigationType } from "react-router-dom";
import FavoriteButton from "./FavoriteButton";
import ImageFrame from "./ImageFrame";
import Icon from "./Icon";
import NewBadge from "./fx/NewBadge";
import useHoverCycle from "../hooks/useHoverCycle";
import { ROOM_TYPE_LABELS, LISTING_STATUS_LABELS, formatVND } from "../utils/labels";
import { saveLastViewed, readLastViewed, isReturningTo } from "../utils/lastViewed";

export default function AccommodationCard({ item, onFavoriteChange, showFavorite = true }) {
  const { pathname, search } = useLocation();
  const navType = useNavigationType();

  // Thẻ này có phải phòng người dùng vừa bấm xem rồi quay lại không
  const isLastViewed =
    isReturningTo(pathname + search, navType) && readLastViewed()?.id === String(item.id);

  const images = item.images || [];
  const { index: imgIndex, bind } = useHoverCycle(images.length); // rê chuột: ảnh tự chuyển
  const sub = [item.address?.district, item.area && `${item.area} m²`, ROOM_TYPE_LABELS[item.roomType]]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      to={`/accommodation/${item.id}`}
      data-card-id={item.id}
      onClick={() => saveLastViewed(item.id)}
      data-tilt
      data-spotlight
      {...bind}
      className={`card card-link relative block overflow-hidden ${isLastViewed ? "last-viewed" : ""}`}
    >
      <ImageFrame src={images[imgIndex]} alt={item.title} fallback="home" />
      {images.length > 1 && (
        <span className="card-dots" aria-hidden="true">
          {images.map((u, i) => <span key={u} className={i === imgIndex ? "on" : ""} />)}
        </span>
      )}

      {showFavorite && (
        <div className="absolute right-3 top-3 z-10">
          <FavoriteButton listingId={item.id} initial={item.isFavorite} onToggle={onFavoriteChange} />
        </div>
      )}

      <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
        <NewBadge createdAt={item.createdAt} />
        {item.status !== "available" && (
          <span className="rounded-full bg-gray-900/75 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
            {LISTING_STATUS_LABELS[item.status]}
          </span>
        )}
      </div>

      <div className="space-y-1.5 p-4 sm:p-5">
        <p className="text-lg font-semibold tabular-nums text-indigo-700 dark:text-brand">
          {formatVND(item.price)}
          <span className="text-sm font-normal text-muted">/tháng</span>
        </p>
        <h3 className="line-clamp-2 font-medium leading-snug">{item.title}</h3>
        {sub && (
          <p className="flex items-center gap-1.5 text-sm text-muted">
            <Icon name="pin" size={14} className="shrink-0" />
            <span className="truncate">{sub}</span>
          </p>
        )}
      </div>
    </Link>
  );
}