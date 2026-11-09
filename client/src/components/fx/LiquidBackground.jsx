import { useEffect, useRef } from "react";
import { reducedMotion } from "../../hooks/useMotion";

// =====================================================================
// Nền 3D nhiều lớp cho toàn trang:
//   lớp xa   — sao li ti lấp lánh
//   lớp giữa — các khối màu Glacier như chất lỏng + dải sóng ở đáy
//   lớp gần  — vài đốm sáng mờ to
// Rê chuột / cuộn trang: các lớp dịch với tốc độ khác nhau (gần nhiều, xa ít) → cảm giác chiều sâu.
// Thỉnh thoảng có sao băng lướt chéo. Chỉ animate transform/opacity.
// =====================================================================

const WAVE =
  "M0 60 C 160 20 320 20 480 60 S 800 100 960 60 S 1280 20 1440 60 S 1760 100 1920 60 S 2240 20 2400 60 S 2720 100 2880 60 V 120 H 0 Z";

// Vị trí sao / đốm sáng tạo một lần khi nạp module (giữ nguyên giữa các lần render)
const rand = (a, b) => a + Math.random() * (b - a);
const STARS = Array.from({ length: 70 }, () => ({
  left: rand(0, 100), top: rand(0, 100), size: rand(1, 2.6), delay: rand(0, 6), dur: rand(3, 7),
}));
const BOKEH = Array.from({ length: 9 }, () => ({
  left: rand(0, 100), top: rand(0, 100), size: rand(40, 110), delay: rand(0, 10),
}));

export default function LiquidBackground() {
  const rootRef = useRef(null);
  const skyRef = useRef(null);

  // Độ sâu theo con trỏ và theo cuộn trang: đặt biến CSS, mỗi khung hình tối đa một lần
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion()) return undefined;
    let frame = 0;
    let px = 0;
    let py = 0;
    const apply = () => {
      frame = 0;
      root.style.setProperty("--bgx", px.toFixed(3));
      root.style.setProperty("--bgy", py.toFixed(3));
      root.style.setProperty("--scroll", String(Math.round(window.scrollY)));
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onMove = (e) => {
      px = (e.clientX / window.innerWidth) * 2 - 1;
      py = (e.clientY / window.innerHeight) * 2 - 1;
      queue();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", queue, { passive: true });
    apply();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", queue);
    };
  }, []);

  // Sao băng: thỉnh thoảng một vệt sáng lướt chéo, tự gỡ khi bay xong; tạm dừng khi tab bị ẩn
  useEffect(() => {
    const sky = skyRef.current;
    if (!sky || reducedMotion()) return undefined;
    let timer = 0;
    const launch = () => {
      if (document.visibilityState === "visible") {
        const s = document.createElement("span");
        s.className = "shooting-star";
        s.style.left = `${rand(35, 105)}vw`;
        s.style.top = `${rand(-5, 40)}vh`;
        s.style.setProperty("--angle", `${rand(-40, -25)}deg`);
        s.style.setProperty("--dist", `${rand(450, 800)}px`);
        s.style.animationDuration = `${rand(0.9, 1.5)}s`;
        s.addEventListener("animationend", () => s.remove(), { once: true });
        sky.appendChild(s);
      }
      timer = setTimeout(launch, rand(4000, 9000));
    };
    timer = setTimeout(launch, rand(1500, 3500));
    return () => clearTimeout(timer);
  }, []);

  return (
    <div ref={rootRef} className="liquid-bg" aria-hidden="true">
      {/* Lớp xa: sao li ti */}
      <div className="bg-layer bg-far">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="bg-star"
            style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, animationDelay: `${s.delay}s`, animationDuration: `${s.dur}s` }}
          />
        ))}
      </div>

      {/* Lớp giữa: chất lỏng + sóng */}
      <div className="bg-layer bg-mid">
        <span className="liquid-blob l1" />
        <span className="liquid-blob l2" />
        <span className="liquid-blob l3" />
        <span className="liquid-blob l4" />
      </div>
      <svg className="liquid-wave w1" viewBox="0 0 2880 120" preserveAspectRatio="none">
        <path d={WAVE} />
      </svg>
      <svg className="liquid-wave w2" viewBox="0 0 2880 120" preserveAspectRatio="none">
        <path d={WAVE} />
      </svg>

      {/* Lớp gần: đốm sáng mờ to */}
      <div className="bg-layer bg-near">
        {BOKEH.map((b, i) => (
          <span
            key={i}
            className="bg-bokeh"
            style={{ left: `${b.left}%`, top: `${b.top}%`, width: b.size, height: b.size, animationDelay: `${b.delay}s` }}
          />
        ))}
      </div>

      {/* Bầu trời cho sao băng */}
      <div ref={skyRef} className="bg-sky" />
    </div>
  );
}
