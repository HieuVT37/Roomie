import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { listAccommodationsApi } from "../../api/accommodations";
import { listPassApi } from "../../api/pass";
import AccommodationCard from "../../components/AccommodationCard";
import PassCard from "../../components/PassCard";

const FEATURES = [
  { icon: "🤝", title: "Matching bạn cùng phòng", desc: "So khớp ngân sách, giờ giấc, mức sạch sẽ và lối sống để ra tỷ lệ tương thích.", to: "/matching" },
  { icon: "🏠", title: "Tìm phòng trọ", desc: "Lọc theo khu vực, giá, diện tích và tiện nghi. Xem ảnh và chi phí chi tiết.", to: "/accommodation" },
  { icon: "📦", title: "Pass phòng & đồ dùng", desc: "Nhượng lại phòng còn hợp đồng, hoặc mua bán, cho tặng đồ dùng cho nhau.", to: "/pass" },
  { icon: "💬", title: "Kết nối & nhắn tin", desc: "Gửi yêu cầu làm quen, trò chuyện trước khi quyết định ở cùng.", to: "/connections" },
];

const STEPS = [
  { n: "1", title: "Tạo hồ sơ", desc: "Cho biết ngân sách, khu vực, giờ sinh hoạt và thói quen của bạn." },
  { n: "2", title: "Xem gợi ý", desc: "Roomie chấm điểm tương thích và xếp những người phù hợp nhất lên đầu." },
  { n: "3", title: "Kết nối", desc: "Gửi yêu cầu, nhắn tin, rồi cùng tìm một căn phòng ưng ý." },
];

const btnPrimary = "rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700";
const btnOutline = "rounded-lg border border-gray-300 px-6 py-3 font-medium hover:bg-white dark:border-gray-600 dark:hover:bg-gray-800";

function HeroActions({ user, loading }) {
  if (loading) return <div className="h-12" />;

  if (!user) {
    return (
      <>
        <Link to="/register" className={btnPrimary}>Bắt đầu miễn phí</Link>
        <Link to="/accommodation" className={btnOutline}>Xem phòng trọ</Link>
      </>
    );
  }
  if (user.role === "admin") {
    return (
      <>
        <Link to="/admin" className={btnPrimary}>Vào trang quản trị</Link>
        <Link to="/accommodation" className={btnOutline}>Xem phòng trọ</Link>
      </>
    );
  }
  return (
    <>
      <Link to="/matching" className={btnPrimary}>Xem gợi ý bạn cùng phòng</Link>
      <Link to="/accommodation" className={btnOutline}>Tìm phòng trọ</Link>
    </>
  );
}

function SectionHeader({ title, to, linkText }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <h2 className="text-2xl font-bold">{title}</h2>
      <Link to={to} className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">{linkText} →</Link>
    </div>
  );
}

export default function HomePage() {
  const { user, profile, loading } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [passes, setPasses] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      listAccommodationsApi({ limit: 3, sort: "newest" }),
      listPassApi({ limit: 3, sort: "newest" }),
    ]).then(([acc, pass]) => {
      if (!active) return;
      if (acc.status === "fulfilled") setRooms(acc.value.items);
      if (pass.status === "fulfilled") setPasses(pass.value.items);
    });
    return () => {
      active = false;
    };
  }, []);

  const needProfile = user && user.role !== "admin" && !profile?.isLookingForRoommate;

  return (
    <div className="mx-auto max-w-6xl space-y-16">
      {needProfile && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-4 dark:border-indigo-900 dark:bg-indigo-950">
          <p className="text-sm">
            <b>Hoàn thiện hồ sơ</b> và bật “Đang tìm bạn cùng phòng” để Roomie gợi ý người phù hợp cho bạn.
          </p>
          <Link to="/profile" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Cập nhật hồ sơ
          </Link>
        </div>
      )}

      {/* Hero */}
      <section className="rounded-3xl bg-gradient-to-br from-indigo-50 via-white to-indigo-100 px-6 py-14 text-center dark:from-indigo-950 dark:via-gray-900 dark:to-gray-900 sm:px-12 sm:py-20">
        <p className="mb-3 text-4xl font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Roomie</p>
        <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-tight sm:text-5xl">
          Tìm bạn cùng phòng <span className="text-indigo-600 dark:text-indigo-400">phù hợp với bạn</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
          Hành trình xa nhà bắt đầu từ một căn phòng mới và một người bạn chưa từng quen. Roomie giúp bạn 
          tìm người bạn cùng phòng phù hợp, đồng điệu trong từng nhịp sống và sẻ chia những điều bình dị, 
          để nơi xa lạ dần trở thành một mái nhà.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <HeroActions user={user} loading={loading} />
        </div>
      </section>

      {/* Tính năng */}
      <section className="space-y-6">
        <h2 className="text-center text-2xl font-bold">Roomie giúp bạn những gì?</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <Link key={f.to} to={f.to}
              className="block rounded-2xl border border-gray-200 p-5 transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700">
              <p className="text-3xl">{f.icon}</p>
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{f.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Cách hoạt động */}
      <section className="space-y-6">
        <h2 className="text-center text-2xl font-bold">Cách hoạt động</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl bg-gray-50 p-6 dark:bg-gray-800">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 font-bold text-white">{s.n}</span>
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Phòng mới */}
      {rooms.length > 0 && (
        <section className="space-y-5">
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
        <section className="space-y-5">
          <SectionHeader title="Pass phòng & đồ dùng mới" to="/pass" linkText="Xem tất cả" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {passes.map((item) => (
              <PassCard key={`${item.id}-${item.isFavorite}`} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Lời kêu gọi cuối trang (chỉ cho khách) */}
      {!loading && !user && (
        <section className="rounded-3xl bg-indigo-600 px-6 py-12 text-center text-white">
          <h2 className="text-2xl font-bold">Sẵn sàng tìm người ở cùng?</h2>
          <p className="mt-2 text-indigo-100">Tạo tài khoản miễn phí chỉ mất một phút.</p>
          <Link to="/register" className="mt-6 inline-block rounded-lg bg-white px-6 py-3 font-medium text-indigo-700 hover:bg-indigo-50">
            Đăng ký ngay
          </Link>
        </section>
      )}
    </div>
  );
}