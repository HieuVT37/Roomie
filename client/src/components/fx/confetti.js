import { reducedMotion } from "../../hooks/useMotion";

// Pháo giấy nhẹ (canvas, không thư viện): bắn từ một điểm, có trọng lực, lực cản không khí,
// mảnh giấy lật xoay 3D (co giãn theo cos) để trông như giấy thật. Tự dọn sau ~2 giây.
const COLORS = ["#5b8def", "#93c5fd", "#bfdbfe", "#ffffff", "#60a5fa", "#fcd34d"];

export function confetti({ x = window.innerWidth / 2, y = window.innerHeight / 2, count = 90 } = {}) {
  if (typeof window === "undefined" || reducedMotion()) return;
  const canvas = document.createElement("canvas");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  Object.assign(canvas.style, { position: "fixed", inset: "0", width: "100%", height: "100%", pointerEvents: "none", zIndex: 80 });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  const parts = Array.from({ length: count }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
    const speed = 7 + Math.random() * 9;
    return {
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.35,
      flip: Math.random() * Math.PI,
      vf: 0.08 + Math.random() * 0.12,
      color: COLORS[(Math.random() * COLORS.length) | 0],
    };
  });

  const start = performance.now();
  const step = (now) => {
    const life = (now - start) / 2200;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of parts) {
      p.vx *= 0.985; // lực cản
      p.vy = p.vy * 0.985 + 0.32; // trọng lực
      p.x += p.vx + Math.sin(p.flip) * 0.6; // chao nhẹ như giấy
      p.y += p.vy;
      p.rot += p.vr;
      p.flip += p.vf;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - life * life);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, Math.cos(p.flip)); // lật mặt giấy
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (life < 1) requestAnimationFrame(step);
    else canvas.remove();
  };
  requestAnimationFrame(step);
}

// Bắn pháo giấy từ vị trí một phần tử (nút vừa bấm), mặc định giữa màn hình
export function confettiFrom(el) {
  if (!el) return confetti();
  const r = el.getBoundingClientRect();
  confetti({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
}
