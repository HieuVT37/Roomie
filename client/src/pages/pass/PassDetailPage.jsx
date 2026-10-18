import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPassApi } from "../../api/pass";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../../components/Avatar";
import ReportButton from "../../components/ReportButton";
import BackButton from "../../components/BackButton";
import FavoriteButton from "../../components/FavoriteButton";
import {
  PASS_TYPE_LABELS, PASS_STATUS_LABELS, MODERATION_LABELS, ITEM_CATEGORY_LABELS,
  CONDITION_LABELS, DEAL_LABELS, passPriceText, formatVND,
} from "../../utils/labels";

function Row({ label, value }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 py-2 text-sm dark:border-gray-800">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export default function PassDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let active = true;
    getPassApi(id)
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
        <BackButton to="/pass" />
      </div>
    );
  }
  if (!data) return <p>Đang tải...</p>;

  const { listing: l, owner, isOwner, contact } = data;
  const images = l.images;
  const room = l.roomInfo || {};
  const item = l.itemInfo || {};

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <BackButton to="/pass" />

      <div className="space-y-2">
        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800">
          {images.length ? (
            <img src={images[current]} alt={l.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-6xl">{l.type === "room" ? "🏠" : "📦"}</div>
          )}
          {!isOwner && (
            <div className="absolute right-3 top-3">
              <FavoriteButton key={l.id} listingId={l.id} initial={data.isFavorite} targetType="pass" />
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

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex gap-2">
            <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-medium text-white">{PASS_TYPE_LABELS[l.type]}</span>
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs dark:bg-gray-700">{PASS_STATUS_LABELS[l.status]}</span>
          </div>
          <h1 className="text-2xl font-bold">{l.title}</h1>
          {l.area && <p className="text-gray-500 dark:text-gray-400">📍 {l.area}</p>}
        </div>
        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{passPriceText(l)}</p>
      </div>

      {isOwner && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-indigo-50 px-4 py-3 text-sm dark:bg-indigo-950">
          <span>Đây là bài của bạn · {MODERATION_LABELS[l.moderationStatus]}</span>
          <Link to={`/pass/${l.id}/edit`} className="rounded-lg bg-indigo-600 px-3 py-1 text-white">Chỉnh sửa</Link>
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
                <Row label="Tình trạng" value={CONDITION_LABELS[item.condition]} />
                <Row label="Hình thức" value={DEAL_LABELS[item.dealType]} />
              </>
            )}
          </section>
        </div>

        <aside className="h-fit space-y-3 rounded-2xl border border-gray-200 p-5 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Avatar src={owner.avatarUrl} name={owner.displayName} />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Người đăng</p>
              <p className="font-semibold">{owner.displayName}</p>
            </div>
          </div>
          {user ? (
            contact ? (
              <p className="rounded-lg bg-indigo-50 px-3 py-2 text-center font-medium dark:bg-indigo-950">📞 {contact}</p>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Người đăng chưa để lại thông tin liên hệ.</p>
            )
          ) : (
            <Link to="/login" className="block rounded-lg border border-gray-300 py-2 text-center dark:border-gray-600">
              Đăng nhập để xem liên hệ
            </Link>
          )}
            {user && !isOwner && user.role !== "admin" && <ReportButton targetType="pass" targetId={l.id} fullWidth />}
        </aside>
      </div>
    </div>
  );
}