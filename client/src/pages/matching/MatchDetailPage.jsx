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
import {
  CRITERIA_LABELS, GENDER_LABELS, GUEST_LABELS, SHARED_LABELS, PATTERN_LABELS, formatBudget,
} from "../../utils/labels";

const yesNo = (v) => (v ? "Có" : "Không");

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 py-2 text-sm dark:border-gray-800">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-right font-medium">{value ?? "—"}</span>
    </div>
  );
}

function Bar({ label, value }) {
  const color = value >= 80 ? "bg-green-500" : value >= 60 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${value}%` }} />
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
        <p className="rounded-lg bg-red-50 px-3 py-2 text-red-600 dark:bg-red-950 dark:text-red-300">{error}</p>
        <div className="flex flex-wrap items-center gap-3">
          <BackButton to="/matching" />
          {quotaHit && (
            <Link to="/pricing" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              Xem các gói dịch vụ
            </Link>
          )}
        </div>
      </div>
    );
  }
  if (!data) return <p>Đang tải...</p>;

  const { profile: p, match } = data;
  const sched = p.schedule;
  const l = p.lifestyle;
  const photos = p.roomPhotos || [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <BackButton to="/matching" />

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-gray-200 p-5 dark:border-gray-700">
        <Avatar src={p.avatarUrl} name={p.displayName} size={80} />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">{p.displayName}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {[p.age && `${p.age} tuổi`, GENDER_LABELS[p.gender], p.school, p.occupation].filter(Boolean).join(" · ")}
          </p>
        </div>
        <ScoreBadge score={match.score} large />
      </div>

      {match.failedDealBreakers.length > 0 && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">
          Không đạt tiêu chí bắt buộc: {match.failedDealBreakers.map((k) => CRITERIA_LABELS[k]).join(", ")}
        </p>
      )}

      {p.bio && <p className="rounded-2xl border border-gray-200 p-5 dark:border-gray-700">{p.bio}</p>}

      {photos.length > 0 && (
        <section className="space-y-3 rounded-2xl border border-gray-200 p-5 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Phòng đang ở</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((url, i) => (
              <button
                type="button"
                key={url}
                onClick={() => setViewer({ images: photos, index: i })}
                className="aspect-[4/3] overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800"
              >
                <img src={url} alt={`Ảnh phòng ${i + 1}`} loading="lazy" className="h-full w-full object-cover transition hover:scale-105" />
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3 rounded-2xl border border-gray-200 p-5 dark:border-gray-700">
        <h2 className="text-lg font-semibold">Mức độ tương thích chi tiết</h2>
        {Object.entries(match.breakdown).map(([key, value]) => (
          <Bar key={key} label={CRITERIA_LABELS[key]} value={value} />
        ))}
      </section>

      <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-700">
        <h2 className="mb-2 text-lg font-semibold">Thông tin sống chung</h2>
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