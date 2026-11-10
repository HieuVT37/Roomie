import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getMatchApi } from "../../api/matching";
import Avatar from "../../components/Avatar";
import BackButton from "../../components/BackButton";
import ConnectPanel from "../../components/ConnectPanel";
import Lightbox from "../../components/Lightbox";
import ReportButton from "../../components/ReportButton";
import ScoreBadge from "../../components/ScoreBadge";
import usePageTitle from "../../hooks/usePageTitle";
import ImageFrame from "../../components/ImageFrame";
import {
  CRITERIA_LABELS, GENDER_LABELS, GUEST_LABELS, SHARED_LABELS, PATTERN_LABELS, formatBudget,
} from "../../utils/labels";
import { DetailSkeleton } from "../../components/ListStates";
import MatchInsightCard from "./MatchInsightCard";

const yesNo = (v) => (v ? "Có" : "Không");

function Row({ label, value }) {
  return (
    <div className="info-row">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium">{value ?? "—"}</span>
    </div>
  );
}

function Bar({ label, value }) {
  const color = value >= 80 ? "bg-emerald-500" : value >= 60 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="font-semibold tabular-nums">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
        {/* thanh chạy từ 0 đến giá trị khi trang mở */}
        <div className={`bar-grow h-2 rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function MatchDetailPage() {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [relation, setRelation] = useState(null);
  const [quotaHit, setQuotaHit] = useState(false);
  const [viewer, setViewer] = useState(null); // { images, index }

  useEffect(() => {
    let active = true;
    getMatchApi(userId)
      .then((res) => {
        if (!active) return;
        setData(res);
        setRelation(res.relation);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.response?.data?.message || "Không thể kết nối máy chủ");
        setQuotaHit(err.response?.data?.code === "QUOTA_EXCEEDED");
      });
    return () => {
      active = false;
    };
  }, [userId]);

  usePageTitle(data?.profile?.displayName);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl space-y-3">
        <p className="alert-error">{error}</p>
        <div className="flex flex-wrap items-center gap-3">
          <BackButton to="/matching" />
          {quotaHit && (
            <Link to="/pricing" className="btn btn-primary btn-sm">
              Xem các gói dịch vụ
            </Link>
          )}
        </div>
      </div>
    );
  }
  if (!data) return <DetailSkeleton />;

  const { profile: p, match } = data;
  const sched = p.schedule;
  const l = p.lifestyle;
  const photos = p.roomPhotos || [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <BackButton to="/matching" />

      <div className="card enter flex flex-wrap items-center gap-5 p-5 sm:p-6">
        <Avatar src={p.avatarUrl} name={p.displayName} size={80} zoomable />
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-semibold">{p.displayName}</h1>
          <p className="text-sm text-muted">
            {[p.age && `${p.age} tuổi`, GENDER_LABELS[p.gender], p.school, p.occupation].filter(Boolean).join(" · ")}
          </p>
        </div>
        <ScoreBadge score={match.score} large />
      </div>

      {match.failedDealBreakers.length > 0 && (
        <p className="alert-error">
          Không đạt tiêu chí bắt buộc: {match.failedDealBreakers.map((k) => CRITERIA_LABELS[k]).join(", ")}
        </p>
      )}

      {p.bio && <p className="card p-5 leading-7 sm:p-6">{p.bio}</p>}

      {photos.length > 0 && (
        <section className="card space-y-3 p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Phòng đang ở</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((url, i) => (
              <button
                type="button"
                key={url}
                onClick={() => setViewer({ images: photos, index: i })}
                aria-label={`Xem ảnh phòng ${i + 1}`}
                className="card-link block overflow-hidden rounded-xl"
              >
                <ImageFrame src={url} alt={`Ảnh phòng ${i + 1}`} fallback="home" />
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="card p-5 sm:p-6">
        <h2 className="mb-5 text-lg font-semibold">Mức độ tương thích chi tiết</h2>
        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {Object.entries(match.breakdown).map(([key, value]) => (
          <Bar key={key} label={CRITERIA_LABELS[key]} value={value} />
        ))}
        </div>
      </section>

      <MatchInsightCard key={p.userId} userId={p.userId} />

      <section className="card p-5 sm:p-6">
        <h2 className="mb-3 text-lg font-semibold">Thông tin sống chung</h2>
        <Row label="Thành phố" value={p.city} />
        <Row label="Khu vực mong muốn" value={p.locations.join(", ")} />
        <Row label="Ngân sách" value={formatBudget(p.budget)} />
        <Row label="Lịch sinh hoạt"
          value={sched ? `Ngủ ${sched.sleepTime} · Dậy ${sched.wakeTime} (${PATTERN_LABELS[sched.pattern] || "—"})` : "Đã ẩn"} />
        <Row label="Sạch sẽ, ngăn nắp" value={l.cleanliness && `${l.cleanliness}/5`} />
        <Row label="Mức độ ồn chấp nhận" value={l.noiseLevel && `${l.noiseLevel}/5`} />
        <Row label="Nhu cầu riêng tư" value={l.privacyNeed && `${l.privacyNeed}/5`} />
        <Row label="Tiếp khách" value={GUEST_LABELS[l.guestFrequency]} />
        <Row label="Dùng không gian chung" value={SHARED_LABELS[l.sharedSpaceUsage]} />
        <Row label="Hút thuốc" value={yesNo(l.smoking)} />
        <Row label="Thú cưng" value={yesNo(l.pets)} />
        <Row label="Sở thích" value={p.interests.length ? p.interests.join(", ") : "Không có hoặc đã ẩn"} />
        <Row label="Yêu cầu khi sống chung" value={p.requirements.join(", ") || "Không có"} />
      </section>

      <ConnectPanel userId={p.userId} relation={relation || data.relation} onChange={setRelation} />
      <ReportButton targetType="user" targetId={p.userId} />

      {viewer && (
        <Lightbox
          images={viewer.images}
          index={viewer.index}
          onClose={() => setViewer(null)}
          onChange={(i) => setViewer((v) => ({ ...v, index: i }))}
        />
      )}
    </div>
  );
}