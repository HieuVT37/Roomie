import { useEffect } from "react";
import { reducedMotion } from "./useMotion";

// =====================================================================
// Bộ điều khiển hiệu ứng chung cho cả trang (một bộ lắng nghe, ủy quyền sự kiện):
//   [data-tilt]       thẻ nghiêng 3D theo con trỏ
//   [data-spotlight]  vệt sáng + viền sáng chạy theo con trỏ
//   [data-parallax]   các lớp lệch nhau theo con trỏ (--px, --py từ -1 đến 1)
//   .btn              gợn sóng tại điểm bấm
//   [data-inview]     gắn lớp .in-view khi phần tử lọt vào màn hình (một lần)
// Chỉ chạy với chuột thật (không chạy trên màn hình cảm ứng) và khi không bật giảm chuyển động.
// =====================================================================

const TILT_MAX = 4; // độ nghiêng tối đa (độ), nhẹ để cảm giác thật

export default function useGlobalFx() {
  useEffect(() => {
    if (reducedMotion()) return undefined;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    let frame = 0;
    let last = null; // sự kiện chuột mới nhất, xử lý một lần mỗi khung hình
    let tilted = null;
    let parallaxed = null;

    const resetTilt = (el) => {
      el.classList.remove("is-tilting");
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    };
    const resetParallax = (el) => {
      el.style.setProperty("--px", "0");
      el.style.setProperty("--py", "0");
    };

    const update = () => {
      frame = 0;
      const e = last;
      if (!e) return;
      const target = e.target instanceof Element ? e.target : null;

      // Vệt sáng
      const spot = target?.closest("[data-spotlight]");
      if (spot) {
        const r = spot.getBoundingClientRect();
        spot.style.setProperty("--mx", `${e.clientX - r.left}px`);
        spot.style.setProperty("--my", `${e.clientY - r.top}px`);
      }

      // Nghiêng 3D
      const tilt = target?.closest("[data-tilt]");
      if (tilted && tilted !== tilt) resetTilt(tilted);
      if (tilt) {
        const r = tilt.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5; // -0.5..0.5
        const y = (e.clientY - r.top) / r.height - 0.5;
        tilt.classList.add("is-tilting");
        tilt.style.setProperty("--ry", `${(x * TILT_MAX * 2).toFixed(2)}deg`);
        tilt.style.setProperty("--rx", `${(-y * TILT_MAX * 2).toFixed(2)}deg`);
      }
      tilted = tilt;

      // Lớp lệch theo con trỏ
      const para = target?.closest("[data-parallax]");
      if (parallaxed && parallaxed !== para) resetParallax(parallaxed);
      if (para) {
        const r = para.getBoundingClientRect();
        para.style.setProperty("--px", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
        para.style.setProperty("--py", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
      }
      parallaxed = para;
    };

    const onMove = (e) => {
      last = e;
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onLeaveWindow = () => {
      if (tilted) resetTilt(tilted);
      if (parallaxed) resetParallax(parallaxed);
      tilted = parallaxed = null;
    };

    // Gợn sóng khi bấm nút (cả cảm ứng lẫn chuột)
    const onDown = (e) => {
      const btn = e.target instanceof Element ? e.target.closest(".btn") : null;
      if (!btn || btn.disabled) return;
      const r = btn.getBoundingClientRect();
      const size = Math.max(r.width, r.height) * 2.2;
      const dot = document.createElement("span");
      dot.className = "ripple";
      dot.style.width = dot.style.height = `${size}px`;
      dot.style.left = `${e.clientX - r.left - size / 2}px`;
      dot.style.top = `${e.clientY - r.top - size / 2}px`;
      btn.appendChild(dot);
      dot.addEventListener("animationend", () => dot.remove(), { once: true });
    };

    // Phần tử lọt vào màn hình
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("in-view");
          io.unobserve(en.target);
        }
      }),
      { rootMargin: "0px 0px -10% 0px" },
    );
    const seen = new WeakSet();
    const scan = () => document.querySelectorAll("[data-inview]").forEach((el) => {
      if (!seen.has(el)) {
        seen.add(el);
        io.observe(el);
      }
    });
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    if (finePointer) {
      document.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("mouseleave", onLeaveWindow);
    }
    document.addEventListener("pointerdown", onDown, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeaveWindow);
      document.removeEventListener("pointerdown", onDown);
      io.disconnect();
      mo.disconnect();
    };
  }, []);
}
