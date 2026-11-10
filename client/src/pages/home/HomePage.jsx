import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { listAccommodationsApi } from "../../api/accommodations";
import { listPassApi } from "../../api/pass";
import { getPlansApi } from "../../api/billing";
import AccommodationCard from "../../components/AccommodationCard";
import PassCard from "../../components/PassCard";
import PlanCards from "../../components/PlanCards";
import Icon from "../../components/Icon";
import { useRestoreLastViewed } from "../../utils/lastViewed";
import { CRITERIA_LABELS } from "../../utils/labels";
import { PHOTOS } from "../../config/photos";
import SplitText from "../../components/fx/SplitText";
import CountUp from "../../components/fx/CountUp";

// Các quận nội thành Hà Nội cho dải chữ trôi ngang
const DISTRICTS = [
  "Cầu Giấy", "Đống Đa", "Thanh Xuân", "Hai Bà Trưng", "Ba Đình", "Hoàn Kiếm",
  "Hoàng Mai", "Long Biên", "Tây Hồ", "Nam Từ Liêm", "Bắc Từ Liêm", "Hà Đông",
];

const STEPS = [
  { n: "01", title: "Tạo hồ sơ", desc: "Cho biết ngân sách, khu vực, giờ sinh hoạt và thói quen của bạn." },
  { n: "02", title: "Xem gợi ý", desc: "Roomie chấm điểm tương thích và xếp những người phù hợp nhất lên đầu." },
  { n: "03", title: "Kết nối", desc: "Gửi yêu cầu, nhắn tin, rồi cùng tìm một căn phòng ưng ý." },
];

// Mẫu giao diện chấm điểm trong hero (minh họa cách Roomie so khớp, không phải người dùng thật)
const SAMPLE_SCORES = [
  ["budget", 0.92],
  ["schedule", 0.84],
  ["cleanliness", 0.88],
];

function Photo({ photo, className = "", sizes = "(min-width: 1024px) 50vw, 100vw", eager = false }) {
  return (
    <div className={`photo ${className}`}>
      <img
        src={photo.src}
        srcSet={photo.srcSet}
        sizes={sizes}
        width={photo.width}
        height={photo.height}
        alt={photo.alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
      />
    </div>
  );
}

function HeroActions({ user, loading }) {
  if (loading) return <div className="h-12" />;

  if (!user) {
    return (
      <>
        <Link to="/register" className="btn btn-primary shine h-12 px-6 text-base">Bắt đầu miễn phí</Link>
        <Link to="/accommodation" className="btn btn-secondary h-12 px-6 text-base">Xem phòng trọ</Link>
      </>
    );
  }
  if (user.role === "admin") {
    return (
      <>
        <Link to="/admin" className="btn btn-primary shine h-12 px-6 text-base">Vào trang quản trị</Link>
        <Link to="/accommodation" className="btn btn-secondary h-12 px-6 text-base">Xem phòng trọ</Link>
      </>
    );
  }
  return (
    <>
      <Link to="/matching" className="btn btn-primary shine h-12 px-6 text-base">Xem gợi ý bạn cùng phòng</Link>
      <Link to="/accommodation" className="btn btn-secondary h-12 px-6 text-base">Tìm phòng trọ</Link>
    </>
  );
}

function SectionHeader({ title, desc, to, linkText }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-semibold sm:text-3xl">{title}</h2>
        {desc && <p className="mt-2 text-muted">{desc}</p>}
      </div>
      {to && (
        <Link to={to} className="arrow-link inline-flex items-center gap-1.5 text-sm font-medium text-indigo-700 dark:text-brand">
          {linkText}
          <Icon name="arrowRight" size={16} />
        </Link>
      )}
    </div>
  );
}

// Thẻ tính năng: tiêu đề + mô tả + link, phần hình ảnh truyền qua children
function FeatureText({ icon, title, desc, cta }) {
  return (
    <div className="flex flex-col p-6 sm:p-7">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-subtle text-brand">
        <Icon name={icon} size={20} />
      </span>
      <h3 className="mt-5 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{desc}</p>
      <span className="arrow-link mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-700 dark:text-brand">
        {cta}
        <Icon name="arrowRight" size={16} />
      </span>
    </div>
  );
}

export default function HomePage() {
  const { user, profile, loading } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [passes, setPasses] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      listAccommodationsApi({ limit: 3, sort: "newest" }),
      listPassApi({ limit: 3, sort: "newest" }),
      getPlansApi(),
    ]).then(([acc, pass, plan]) => {
      if (!active) return;
      if (acc.status === "fulfilled") setRooms(acc.value.items);
      if (pass.status === "fulfilled") setPasses(pass.value.items);
      if (plan.status === "fulfilled") setPlans(plan.value.plans);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useRestoreLastViewed(loaded);

  const needProfile = user && user.role !== "admin" && !profile?.isLookingForRoommate;

  return (
    <div className="space-y-24 sm:space-y-32">
      <div className="space-y-6">
        {needProfile && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-surface px-5 py-4 dark:border-indigo-900">
            <p className="text-sm">
              <b>Hoàn thiện hồ sơ</b> và bật “Đang tìm bạn cùng phòng” để Roomie gợi ý người phù hợp cho bạn.
            </p>
            <Link to="/profile" className="btn btn-primary btn-sm">Cập nhật hồ sơ</Link>
          </div>
        )}

        {/* Hero: chữ bên trái, ảnh căn hộ + mẫu giao diện chấm điểm bên phải */}
        <section className="relative isolate grid items-center gap-10 lg:min-h-[calc(100svh-12rem)] lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          {/* Đốm sáng Glacier trôi chậm phía sau hero */}
          <div className="glow-field" aria-hidden="true">
            <span className="glow-blob b1" />
            <span className="glow-blob b2" />
            <span className="glow-blob b3" />
          </div>
          <div className="enter">
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-sm text-muted">
              <Icon name="pin" size={15} className="text-brand" />
              Chúng tôi luôn đồng hành cùng bạn
            </p>
            <SplitText
              lines={["Roomie", "Hợp gu trước", "Hợp đồng sau"]}
              className="mt-6 text-4xl font-semibold leading-[1.12] sm:text-5xl lg:text-[3.5rem]"
            />
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
              Roomie là nền tảng kết nối bạn cùng phòng, tìm phòng trọ và pass đồ cũ dành cho sinh viên
            </p>
            <div className="mt-9 flex flex-wrap gap-3 max-sm:[&>*]:w-full">
              <HeroActions user={user} loading={loading} />
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              <li className="inline-flex items-center gap-2"><Icon name="check" size={16} className="text-brand" />Ghép bạn theo 8 tiêu chí</li>
              <li className="inline-flex items-center gap-2"><Icon name="shield" size={16} className="text-brand" />Tin đăng được duyệt trước khi hiển thị</li>
            </ul>
          </div>

          {/* Khối ảnh 3D: cả khối nghiêng theo con trỏ, ảnh lùi vào trong, thẻ điểm nổi ra phía trước */}
          <div className="enter relative" data-parallax>
            <div className="parallax-stage relative">
              <Photo
                photo={PHOTOS.livingRoom}
                eager
                className="parallax-back aspect-[4/3] rounded-[1.75rem] shadow-[0_30px_80px_-30px_rgb(30_58_138/0.55)] lg:aspect-[4/5]"
              />
              {/* Mẫu thẻ chấm điểm — giao diện thật của tính năng Matching */}
              <div className="parallax-front absolute -bottom-6 left-4 w-[17rem] sm:left-6 sm:w-72 lg:-left-8 lg:bottom-10">
                <div className="card float-soft p-4 shadow-[var(--shadow-lift)]">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Mức độ phù hợp</p>
                    <span className="rounded-full bg-subtle px-2.5 py-0.5 text-sm font-semibold text-indigo-700 dark:text-brand">
                      <CountUp value={87} format={(n) => `${n}%`} duration={1800} />
                    </span>
                  </div>
                  <ul className="mt-4 space-y-3">
                    {SAMPLE_SCORES.map(([key, v], i) => (
                      <li key={key}>
                        <div className="flex justify-between text-xs text-muted">
                          <span>{CRITERIA_LABELS[key]}</span>
                          <CountUp value={Math.round(v * 100)} duration={1500 + i * 200} />
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                          {/* thanh chạy dần, lệch nhịp nhau */}
                          <div
                            className="bar-grow h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400"
                            style={{ width: `${v * 100}%`, animationDelay: `${500 + i * 180}ms`, animationDuration: "1300ms" }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dải khu vực Hà Nội trôi ngang (dừng khi rê chuột) */}
        <div className="marquee pt-10" aria-label={`Khu vực: ${DISTRICTS.join(", ")}`}>
          <div className="marquee-track" aria-hidden="true">
            {[...DISTRICTS, ...DISTRICTS].map((d, i) => (
              <span key={i} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-line bg-surface/70 px-4 py-2 text-sm text-muted backdrop-blur">
                <Icon name="pin" size={14} className="text-brand" />
                {d}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tính năng: bố cục so le, mỗi thẻ một kiểu hình ảnh */}
      <section data-reveal className="space-y-8">
        <SectionHeader
          title="Bốn việc Roomie làm giúp bạn"
          desc="Từ lúc bắt đầu tìm chỗ ở đến khi dọn vào, mọi bước nằm trong một ứng dụng."
        />
        <div className="grid gap-5 lg:grid-cols-6">
          {/* Tìm phòng: ảnh phòng thật */}
          <Link data-tilt data-spotlight to="/accommodation" className="card card-link grid overflow-hidden sm:grid-cols-2 lg:col-span-4">
            <FeatureText
              icon="home"
              title="Tìm phòng trọ"
              desc="Lọc theo khu vực, giá, diện tích và tiện nghi. Xem ảnh và chi phí chi tiết trước khi hẹn xem phòng."
              cta="Xem phòng trọ"
            />
            <Photo photo={PHOTOS.kitchen} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="aspect-[4/3] sm:aspect-auto sm:h-full" />
          </Link>

          {/* Ghép bạn: 8 tiêu chí thật của hệ thống */}
          <Link data-tilt data-spotlight to="/matching" className="card card-link flex flex-col lg:col-span-2">
            <FeatureText
              icon="users"
              title="Ghép bạn cùng phòng"
              desc="So khớp ngân sách, giờ giấc, mức sạch sẽ và lối sống để ra tỷ lệ tương thích."
              cta="Xem gợi ý"
            />
            <ul className="mt-auto flex flex-wrap gap-2 px-6 pb-7 sm:px-7">
              {Object.values(CRITERIA_LABELS).map((label) => (
                <li key={label} className="rounded-full border border-line px-2.5 py-1 text-xs text-muted">{label}</li>
              ))}
            </ul>
          </Link>

          {/* Pass đồ: ảnh đồ dùng */}
          <Link data-tilt data-spotlight to="/pass" className="card card-link flex flex-col overflow-hidden lg:col-span-2">
            <FeatureText
              icon="package"
              title="Pass phòng & đồ dùng"
              desc="Nhượng lại phòng còn hợp đồng, hoặc mua bán, cho tặng đồ dùng cho nhau."
              cta="Xem đồ pass"
            />
            <Photo photo={PHOTOS.lampBooks} sizes="(min-width: 1024px) 33vw, 100vw" className="mt-auto aspect-[16/9] [&_img]:object-[50%_80%]" />
          </Link>

          {/* Nhắn tin: mẫu khung chat */}
          <Link data-tilt data-spotlight to="/connections" className="card card-link grid overflow-hidden sm:grid-cols-2 lg:col-span-4">
            <FeatureText
              icon="message"
              title="Kết nối & nhắn tin"
              desc="Gửi yêu cầu làm quen, trò chuyện trước khi quyết định ở cùng. Chỉ người đã chấp nhận kết nối mới nhắn được cho bạn."
              cta="Xem kết nối"
            />
            <div aria-hidden="true" className="flex flex-col justify-center gap-2.5 bg-subtle p-6 text-sm sm:p-7">
              <p className="max-w-[85%] self-start rounded-2xl rounded-bl-md bg-surface px-3.5 py-2.5 shadow-[var(--shadow-soft)]">
                Chào bạn, mình thấy hai đứa hợp giờ giấc ghê. Bạn định ở khu nào?
              </p>
              <p className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-btn px-3.5 py-2.5 text-btn-ink">
                Mình học ở Cầu Giấy nên muốn tìm quanh đó, tầm 2–3 triệu.
              </p>
              <p className="max-w-[85%] self-start rounded-2xl rounded-bl-md bg-surface px-3.5 py-2.5 shadow-[var(--shadow-soft)]">
                Chuẩn luôn, tối nay mình gửi bạn vài phòng nhé.
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* Cách hoạt động: số lớn, chữ dẫn dắt */}
      <section data-reveal className="space-y-10">
        <SectionHeader title="Ba bước để có người ở cùng" />
        <ol data-inview className="relative grid gap-10 pt-10 md:grid-cols-3 md:gap-8">
          <span aria-hidden="true" className="draw-line absolute inset-x-0 top-0 h-px bg-gradient-to-r from-indigo-500 via-indigo-300 to-transparent" />
          {STEPS.map((s, i) => (
            <li key={s.n} className="relative">
              <span aria-hidden="true" className="step-dot absolute -top-[calc(2.5rem+4px)] left-0 max-md:hidden h-2 w-2 rounded-full bg-brand shadow-[0_0_0_4px_rgb(91_141_239/0.2)]" style={{ "--i": i }} />
              <span className="text-5xl font-semibold tracking-tight text-indigo-400 tabular-nums dark:text-indigo-800">{s.n}</span>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 max-w-xs text-sm leading-6 text-muted">{s.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Phòng mới */}
      {rooms.length > 0 && (
        <section data-reveal className="space-y-8">
          <SectionHeader title="Phòng trọ mới đăng" to="/accommodation" linkText="Xem tất cả" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((item) => (
              <AccommodationCard key={`${item.id}-${item.isFavorite}`} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Pass mới */}
      {passes.length > 0 && (
        <section data-reveal className="space-y-8">
          <SectionHeader title="Pass phòng & đồ dùng mới" to="/pass" linkText="Xem tất cả" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {passes.map((item) => (
              <PassCard key={`${item.id}-${item.isFavorite}`} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Bảng giá */}
      {plans.length > 0 && (
        <section data-reveal className="space-y-8">
          <SectionHeader
            title="Bảng giá"
            desc="Bắt đầu miễn phí, nâng cấp khi bạn cần nhiều lượt kết nối hơn. Mỗi gói trả phí dùng trong 30 ngày."
            to="/pricing"
            linkText="Chi tiết các gói"
          />
          <PlanCards plans={plans} user={user} />
        </section>
      )}

      {/* Lời kêu gọi cuối trang (chỉ cho khách): ảnh phòng ngủ căn hộ */}
      {!loading && !user && (
        <section data-reveal className="relative isolate overflow-hidden rounded-[1.75rem]">
          <Photo photo={PHOTOS.bedroom} sizes="100vw" className="kenburns absolute inset-0 -z-10" />
          <div className="absolute inset-0 -z-10 bg-gray-950/60" />
          <div className="px-6 py-16 text-center text-white sm:px-12 sm:py-24">
            <h2 className="text-3xl font-semibold sm:text-4xl">Sẵn sàng tìm người ở cùng?</h2>
            <p className="mx-auto mt-3 max-w-md text-white/80">Tạo tài khoản miễn phí chỉ mất một phút.</p>
            <Link to="/register" className="btn mt-8 h-12 bg-white px-6 text-base text-gray-900 hover:bg-indigo-50">
              Tạo tài khoản miễn phí
            </Link>
          </div>
        </section>
      )}

    </div>
  );
}
