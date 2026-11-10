import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPassApi } from "../../api/pass";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../../components/Avatar";
import ReportButton from "../../components/ReportButton";
import BackButton from "../../components/BackButton";
import FavoriteButton from "../../components/FavoriteButton";
import usePageTitle from "../../hooks/usePageTitle";
import MessageButton from "../../components/MessageButton";
import ImageGallery from "../../components/ImageGallery";
import {
  PASS_TYPE_LABELS, PASS_STATUS_LABELS, MODERATION_LABELS, ITEM_CATEGORY_LABELS,
  conditionLabel, DEAL_LABELS, passPriceText, formatVND,
} from "../../utils/labels";
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

export default function PassDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getPassApi(id)
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
        <BackButton to="/pass" />
      </div>
    );
  }
  if (!data) return <DetailSkeleton />;

  const { listing: l, owner, isOwner, contact } = data;
  const images = l.images;
  const room = l.roomInfo || {};
  const item = l.itemInfo || {};

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <BackButton to="/pass" />

      <ImageGallery key={l.id} images={images} title={l.title} fallback={l.type === "room" ? "home" : "package"}>
        {!isOwner && <FavoriteButton listingId={l.id} initial={data.isFavorite} targetType="pass" />}
      </ImageGallery>
      
        {/* ... bộ đếm ảnh giống trên ... */}
        {!isOwner && (
          <div className="absolute right-3 top-3 z-10">
            <FavoriteButton key={l.id} listingId={l.id} initial={data.isFavorite} targetType="pass" />
          </div>
        )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex gap-2">
            <span className="rounded-full bg-subtle px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:text-brand">{PASS_TYPE_LABELS[l.type]}</span>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-muted dark:bg-gray-700">{PASS_STATUS_LABELS[l.status]}</span>
          </div>
          <h1 className="text-3xl font-semibold">{l.title}</h1>
          {l.area && <p className="mt-2 flex items-center gap-1.5 text-muted"><Icon name="pin" size={17} />{l.area}</p>}
        </div>
        <p className="text-3xl font-semibold tabular-nums text-indigo-700 dark:text-brand">{passPriceText(l)}</p>
      </div>

      {isOwner && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-subtle px-4 py-3 text-sm dark:border-indigo-900">
          <span>Đây là bài của bạn · {MODERATION_LABELS[l.moderationStatus]}{l.moderationStatus === "pending" && " · Bài sẽ hiển thị công khai sau khi admin duyệt"}</span>
          <Link to={`/pass/${l.id}/edit`} className="btn btn-primary btn-sm">Chỉnh sửa</Link>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          {l.description && (
            <section className="card p-5 sm:p-6">
              <h2 className="mb-3 text-lg font-semibold">Mô tả</h2>
              <p className="whitespace-pre-wrap">{l.description}</p>
            </section>
          )}

          <section className="card p-5 sm:p-6">
            <h2 className="mb-3 text-lg font-semibold">Thông tin chi tiết</h2>
            {l.type === "room" ? (
              <>
                <Row label="Địa chỉ phòng" value={room.address} />
                <Row label="Tiền cọc" value={room.deposit != null ? formatVND(room.deposit) : null} />
                <Row label="Hợp đồng còn lại" value={room.remainingLeaseMonths != null ? `${room.remainingLeaseMonths} tháng` : null} />
                <Row label="Có thể bàn giao từ" value={room.availableFrom && new Date(room.availableFrom).toLocaleDateString("vi-VN")} />
                <Row label="Chủ nhà đồng ý chuyển nhượng" value={room.landlordAgreed ? "Có" : "Chưa xác nhận"} />
                <Row label="Điều khoản chuyển nhượng" value={room.transferTerms} />
              </>
            ) : (
              <>
                <Row label="Danh mục" value={ITEM_CATEGORY_LABELS[item.category]} />
                <Row label="Tình trạng" value={conditionLabel(item.condition)} />
                <Row label="Hình thức" value={DEAL_LABELS[item.dealType]} />
              </>
            )}
          </section>
        </div>

        <aside className="card h-fit space-y-3 p-5 sm:p-6 md:sticky md:top-28">
          <div className="flex items-center gap-3">
            <Avatar src={owner.avatarUrl} name={owner.displayName} zoomable />
            <div>
              <p className="text-xs text-muted">Người đăng</p>
              <p className="font-semibold">{owner.displayName}</p>
            </div>
          </div>
          {user ? (
            contact ? (
              <p className="flex items-center justify-center gap-2 rounded-xl bg-subtle px-3 py-2.5 font-medium tabular-nums"><Icon name="phone" size={17} className="text-brand" />{contact}</p>
            ) : (
              <p className="text-sm text-muted">Người đăng chưa để lại thông tin liên hệ.</p>
            )
          ) : (
            <Link to="/login" className="btn btn-secondary w-full">
              Đăng nhập để xem liên hệ
            </Link>
          )}
          {user && !isOwner && user.role !== "admin" && <MessageButton userId={owner.userId} />}
          {user && !isOwner && user.role !== "admin" && <ReportButton targetType="pass" targetId={l.id} fullWidth />}
        </aside>
      </div>
    </div>
  );
}