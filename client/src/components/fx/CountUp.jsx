import { useEffect, useRef, useState } from "react";
import { reducedMotion } from "../../hooks/useMotion";

// Số đếm dần từ 0 khi lọt vào màn hình (một lần). Chậm dần về cuối để cảm giác "dừng lại" tự nhiên.
export default function CountUp({ value, format = (n) => n.toLocaleString("vi-VN"), duration = 1400, className = "" }) {
  const ref = useRef(null);
  const target = Number(value) || 0;
  const [shown, setShown] = useState(0);
  // Không có hiệu ứng (giảm chuyển động / trình duyệt cũ): hiện ngay giá trị cuối
  const noFx = reducedMotion() || typeof IntersectionObserver === "undefined";
  const display = noFx ? target : shown;

  useEffect(() => {
    const el = ref.current;
    if (!el || noFx) return undefined;
    let raf = 0;
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 4); // ease-out quart
        setShown(Math.round(target * eased));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { rootMargin: "0px 0px -5% 0px" });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target, duration, noFx]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`} aria-label={format(target)}>
      <span aria-hidden="true">{format(display)}</span>
    </span>
  );
}
