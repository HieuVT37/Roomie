import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMatchInsightApi, createMatchInsightApi } from "../../api/matching";
import Icon from "../../components/Icon";
import { toast } from "../../components/fx/Toaster";

function Points({ title, items, tone }) {
  if (!items?.length) return null;
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <ul className="space-y-1.5">
        {items.map((t) => (
          <li key={t} className="flex gap-2 text-sm leading-6">
            <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${tone}`} aria-hidden="true" />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AiScore({ insight }) {
  const { aiScore, adjustment } = insight;
  const sign = adjustment > 0 ? `+${adjustment}` : String(adjustment);
  const tone =
    adjustment > 0 ? "text-emerald-600 dark:text-emerald-400" : adjustment < 0 ? "text-rose-600 dark:text-rose-400" : "text-muted";
  return (
    <p className="text-sm" title="Điểm thuật toán, điều chỉnh sau khi AI đọc phần giới thiệu, yêu cầu và sở thích">
      <span className="text-muted">Điểm AI đề xuất: </span>
      <span className="font-semibold tabular-nums">{aiScore}%</span>{" "}
      <span className={`tabular-nums ${tone}`}>({adjustment === 0 ? "giữ nguyên" : `${sign} so với thuật toán`})</span>
    </p>
  );
}

function InsightBody({ insight }) {
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast("Đã sao chép câu mở lời");
    } catch {
      toast("Không sao chép được, bạn hãy chọn và sao chép thủ công");
    }
  };
  return (
    <>
      <p className="leading-7">{insight.summary}</p>
      <div className="grid gap-5 sm:grid-cols-2">
        <Points title="Điểm hợp nhau" items={insight.strengths} tone="bg-emerald-500" />
        <Points title="Nên trao đổi trước" items={insight.cautions} tone="bg-amber-500" />
      </div>
      {insight.openers?.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Gợi ý câu mở lời</h3>
          <div className="space-y-2">
            {insight.openers.map((t) => (
              <div key={t} className="flex items-start gap-2 rounded-xl bg-subtle p-3 text-sm leading-6">
                <span className="flex-1">“{t}”</span>
                <button type="button" onClick={() => copy(t)} aria-label="Sao chép câu mở lời" className="btn btn-ghost h-8 w-8 shrink-0 !p-0">
                  <Icon name="copy" size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="text-xs text-muted">Nhận xét do AI tạo, chỉ mang tính tham khảo. Hãy trò chuyện trực tiếp trước khi quyết định ở chung.</p>
    </>
  );
}

// Nút tạo nhận xét: bấm là gọi AI ngay (trừ 1 lượt của tháng); trong lúc chờ nút bị khóa để không bấm trùng
function GeneratePanel({ quota, label, intro, onGenerate, busy }) {
  const out = quota.remaining <= 0;

  return (
    <div className="space-y-3">
      {intro && <p className="text-sm leading-6 text-muted">{intro}</p>}
      <p className="text-sm">
        Lượt nhận xét AI tháng này: <span className="font-semibold tabular-nums">còn {quota.remaining}/{quota.limit}</span>
      </p>

      {out ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted">Bạn đã dùng hết lượt của tháng này. Lượt mới có vào ngày 1 tháng sau, hoặc nâng cấp gói để có thêm.</p>
          <Link to="/pricing" className="btn btn-primary btn-sm">Xem các gói dịch vụ</Link>
        </div>
      ) : (
        <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={onGenerate}>
          <Icon name="sparkles" size={16} />
          {busy ? "Roomie AI đang phân tích..." : label}
        </button>
      )}
    </div>
  );
}

// Nhận xét của Roomie AI cho một hồ sơ Matching. Mở trang chỉ đọc bản đã lưu (không tốn lượt);
// chỉ khi người dùng bấm nút mới gọi AI. Lỗi AI không ảnh hưởng phần còn lại của trang.
export default function MatchInsightCard({ userId }) {
  const [data, setData] = useState(null); // { insight, outdated, quota }
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const [genError, setGenError] = useState("");

  useEffect(() => {
    let active = true;
    getMatchInsightApi(userId)
      .then((res) => active && setData(res))
      .catch((err) => active && setLoadError(err.response?.data?.message || "Không kết nối được Roomie AI"));
    return () => {
      active = false;
    };
  }, [userId]);

  const generate = async () => {
    setBusy(true);
    setGenError("");
    try {
      setData(await createMatchInsightApi(userId));
    } catch (err) {
      setGenError(err.response?.data?.message || "Roomie AI tạm thời chưa nhận xét được, bạn thử lại sau");
      // Cập nhật lại số lượt (lỗi AI được hoàn lượt, hết lượt thì hiện nút nâng cấp)
      getMatchInsightApi(userId).then(setData).catch(() => {});
    } finally {
      setBusy(false);
    }
  };

  if (loadError) return null; // không đọc được thì ẩn thẻ, không làm phiền trang chi tiết

  return (
    <section className="card space-y-4 p-5 sm:p-6" aria-busy={!data || busy}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Icon name="sparkles" size={20} className="text-brand" />
          Nhận xét từ Roomie AI
        </h2>
        {data?.insight && <AiScore insight={data.insight} />}
      </div>

      {!data && <div className="skeleton h-10 w-full" aria-label="Đang tải" />}

      {data && !data.insight && (
        <GeneratePanel
          quota={data.quota}
          busy={busy}
          onGenerate={generate}
          label="Nhận xét bằng AI"
          intro="Roomie AI đọc phần giới thiệu, yêu cầu và sở thích của hai bạn (những điều thuật toán chưa hiểu được) để nhận xét điểm phù hợp, điểm cần trao đổi và gợi ý câu mở lời."
        />
      )}

      {data?.insight && (
        <>
          <InsightBody insight={data.insight} />
          {data.outdated && (
            <div className="border-t border-line pt-4">
              <GeneratePanel
                quota={data.quota}
                busy={busy}
                onGenerate={generate}
                label="Cập nhật nhận xét"
                intro="Hồ sơ của bạn hoặc của bạn ấy đã thay đổi sau lần nhận xét này."
              />
            </div>
          )}
        </>
      )}

      {genError && <p className="alert-error">{genError}</p>}
    </section>
  );
}
