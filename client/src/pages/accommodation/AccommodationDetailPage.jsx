import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAccommodationApi } from "../../api/accommodations";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../../components/Avatar";
import FavoriteButton from "../../components/FavoriteButton";
import ReportButton from "../../components/ReportButton";
import BackButton from "../../components/BackButton";
import usePageTitle from "../../hooks/usePageTitle";
import MessageButton from "../../components/MessageButton";
import ImageGallery from "../../components/ImageGallery";
import { ROOM_TYPE_LABELS, LISTING_STATUS_LABELS, MODERATION_LABELS, formatVND } from "../../utils/labels";
import { DetailSkeleton } from "../../components/ListStates";
import Icon from "../../components/Icon";

function Row({ label, value }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="info-row">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export default function AccommodationDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getAccommodationApi(id)
      .then((res) => active && setData(res))
      .catch((err) => active && setError(err.response?.data?.message || "Không thể kết nối máy chủ"));
    return () => {
      active = false;
    };
  }, [id]);

  usePageTitle(data?.listing?.title);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl space-y-3">
        <p className="alert-error">{error}</p>
        <BackButton to="/accommodation" />
      </div>
    );
  }
  if (!data) return <DetailSkeleton />;

  const { listing: l, owner, isOwner, contactPhone } = data;
  const images = l.images;
  const address = [l.address.street, l.address.ward, l.address.district, l.address.city].filter(Boolean).join(", ");
  const costs = l.extraCosts || {};

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <BackButton to="/accommodation" />

      {/* Ảnh */}
      <ImageGallery key={l.id} images={images} title={l.title} fallback="home">
        {!isOwner && <FavoriteButton listingId={l.id} initial={data.isFavorite} />}
      </ImageGallery>

      {/* Tiêu đề */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">{l.title}</h1>
          <p className="mt-2 flex items-start gap-1.5 text-muted"><Icon name="pin" size={17} className="mt-[3px]" />{address}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-semibold tabular-nums text-indigo-700 dark:text-brand">
            {formatVND(l.price)}<span className="text-sm font-normal text-muted">/tháng</span>
          </p>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-muted dark:bg-gray-700">{LISTING_STATUS_LABELS[l.status]}</span>
        </div>
      </div>

      {isOwner && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-subtle px-4 py-3 text-sm dark:border-indigo-900">
          <span>Đây là tin của bạn · {MODERATION_LABELS[l.moderationStatus]} · {l.viewCount} lượt xem{l.moderationStatus === "pending" && " · Tin sẽ hiển thị công khai sau khi admin duyệt"}</span>
          <Link to={`/accommodation/${l.id}/edit`} className="btn btn-primary btn-sm">Chỉnh sửa</Link>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          {l.description && (
            <section className="card p-5 sm:p-6">
              <h2 className="mb-3 text-lg font-semibold">Mô tả</h2>
              <p className="whitespace-pre-wrap leading-7">{l.description}</p>
            </section>
          )}

          <section className="card p-5 sm:p-6">
            <h2 className="mb-3 text-lg font-semibold">Thông tin chi tiết</h2>
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
            <section className="card p-5 sm:p-6">
              <h2 className="mb-3 text-lg font-semibold">Tiện nghi</h2>
              <div className="flex flex-wrap gap-2">
                {l.amenities.map((a) => (
                  <span key={a} className="rounded-full bg-subtle px-3 py-1 text-sm">{a}</span>
                ))}
              </div>
            </section>
          )}

          {l.rentalTerms && (
            <section className="card p-5 sm:p-6">
              <h2 className="mb-3 text-lg font-semibold">Điều khoản thuê</h2>
              <p className="whitespace-pre-wrap leading-7">{l.rentalTerms}</p>
            </section>
          )}
        </div>

        {/* Chủ trọ */}
        <aside className="card h-fit space-y-3 p-5 sm:p-6 md:sticky md:top-28">
          <div className="flex items-center gap-3">
            <Avatar src={owner.avatarUrl} name={owner.displayName} />
            <div>
              <p className="text-xs text-muted">Chủ trọ</p>
              <p className="font-semibold">{owner.displayName}</p>
            </div>
          </div>
          {user ? (
            contactPhone ? (
              <a href={`tel:${contactPhone}`} className="btn btn-primary w-full tabular-nums">
                <Icon name="phone" size={17} />{contactPhone}
              </a>
            ) : (
              <p className="text-sm text-muted">Chủ trọ chưa để lại số liên hệ.</p>
            )
          ) : (
            <Link to="/login" className="btn btn-secondary w-full">
              Đăng nhập để xem liên hệ
            </Link>
          )}
          {user && !isOwner && user.role !== "admin" && <MessageButton userId={owner.userId} />}
          {user && !isOwner && user.role !== "admin" && <ReportButton targetType="accommodation" targetId={l.id} fullWidth />}
        </aside>
      </div>
    </div>
  );
}