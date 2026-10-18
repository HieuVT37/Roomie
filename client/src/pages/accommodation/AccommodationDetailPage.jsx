import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAccommodationApi } from "../../api/accommodations";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../../components/Avatar";
import FavoriteButton from "../../components/FavoriteButton";
import ReportButton from "../../components/ReportButton";
import BackButton from "../../components/BackButton";
import { ROOM_TYPE_LABELS, LISTING_STATUS_LABELS, MODERATION_LABELS, formatVND } from "../../utils/labels";

function Row({ label, value }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 py-2 text-sm dark:border-gray-800">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export default function AccommodationDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let active = true;
    getAccommodationApi(id)
      .then((res) => active && setData(res))
      .catch((err) => active && setError(err.response?.data?.message || "Không thể kết nối máy chủ"));
    return () => {
      active = false;
    };
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl space-y-3">
        <p className="rounded-lg bg-red-50 px-3 py-2 text-red-600 dark:bg-red-950 dark:text-red-300">{error}</p>
        <BackButton to="/accommodation" />
      </div>
    );
  }
  if (!data) return <p>Đang tải...</p>;

  const { listing: l, owner, isOwner, contactPhone } = data;
  const images = l.images;
  const address = [l.address.street, l.address.ward, l.address.district, l.address.city].filter(Boolean).join(", ");
  const costs = l.extraCosts || {};

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <BackButton to="/accommodation" />

      {/* Ảnh */}
      <div className="space-y-2">
        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800">
          {images.length ? (
            <img src={images[current]} alt={l.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-6xl">🏠</div>
          )}
          {!isOwner && (
            <div className="absolute right-3 top-3">
              <FavoriteButton key={l.id} listingId={l.id} initial={data.isFavorite} />
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {images.map((url, i) => (
              <button key={url} onClick={() => setCurrent(i)}
                className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${i === current ? "border-indigo-600" : "border-transparent"}`}>
                <img src={url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tiêu đề */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{l.title}</h1>
          <p className="text-gray-500 dark:text-gray-400">📍 {address}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {formatVND(l.price)}<span className="text-sm font-normal text-gray-500">/tháng</span>
          </p>
          <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs dark:bg-gray-700">{LISTING_STATUS_LABELS[l.status]}</span>
        </div>
      </div>

      {isOwner && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-indigo-50 px-4 py-3 text-sm dark:bg-indigo-950">
          <span>Đây là tin của bạn · {MODERATION_LABELS[l.moderationStatus]} · {l.viewCount} lượt xem</span>
          <Link to={`/accommodation/${l.id}/edit`} className="rounded-lg bg-indigo-600 px-3 py-1 text-white">Chỉnh sửa</Link>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          {l.description && (
            <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-700">
              <h2 className="mb-2 text-lg font-semibold">Mô tả</h2>
              <p className="whitespace-pre-wrap">{l.description}</p>
            </section>
          )}

          <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-700">
            <h2 className="mb-2 text-lg font-semibold">Thông tin chi tiết</h2>
            <Row label="Loại phòng" value={ROOM_TYPE_LABELS[l.roomType]} />
            <Row label="Diện tích" value={l.area && `${l.area} m²`} />
            <Row label="Số người tối đa" value={l.maxOccupants} />
            <Row label="Tiền cọc" value={l.deposit !== undefined && l.deposit !== null ? formatVND(l.deposit) : null} />
            <Row label="Có thể dọn vào" value={l.availableFrom && new Date(l.availableFrom).toLocaleDateString("vi-VN")} />
            <Row label="Giá điện" value={costs.electricity ? `${formatVND(costs.electricity)}/kWh` : null} />
            <Row label="Giá nước" value={costs.water ? formatVND(costs.water) : null} />
            <Row label="Internet" value={costs.internet ? formatVND(costs.internet) : null} />
            <Row label="Chi phí khác" value={costs.other} />
          </section>

          {l.amenities.length > 0 && (
            <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-700">
              <h2 className="mb-3 text-lg font-semibold">Tiện nghi</h2>
              <div className="flex flex-wrap gap-2">
                {l.amenities.map((a) => (
                  <span key={a} className="rounded-full bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">{a}</span>
                ))}
              </div>
            </section>
          )}

          {l.rentalTerms && (
            <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-700">
              <h2 className="mb-2 text-lg font-semibold">Điều khoản thuê</h2>
              <p className="whitespace-pre-wrap">{l.rentalTerms}</p>
            </section>
          )}
        </div>

        {/* Chủ trọ */}
        <aside className="h-fit space-y-3 rounded-2xl border border-gray-200 p-5 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Avatar src={owner.avatarUrl} name={owner.displayName} />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Chủ trọ</p>
              <p className="font-semibold">{owner.displayName}</p>
            </div>
          </div>
          {user ? (
            contactPhone ? (
              <a href={`tel:${contactPhone}`} className="block rounded-lg bg-indigo-600 py-2 text-center font-medium text-white hover:bg-indigo-700">
                📞 {contactPhone}
              </a>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Chủ trọ chưa để lại số liên hệ.</p>
            )
          ) : (
            <Link to="/login" className="block rounded-lg border border-gray-300 py-2 text-center dark:border-gray-600">
              Đăng nhập để xem liên hệ
            </Link>
          )}
            {user && !isOwner && user.role !== "admin" && <ReportButton targetType="accommodation" targetId={l.id} fullWidth />}
        </aside>
      </div>
    </div>
  );
}