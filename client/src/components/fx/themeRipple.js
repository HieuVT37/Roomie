import { flushSync } from "react-dom";
import { reducedMotion } from "../../hooks/useMotion";

// =====================================================================
// Đổi sáng/tối mượt: giao diện mới lan ra thành vòng tròn từ nút bấm.
// Trong lúc chuyển, tạm dừng các hiệu ứng nền nặng để không giật khung hình.
// Dùng View Transitions API khi có; trình duyệt cũ thì màu chuyển dần (cross-fade).
// =====================================================================

export function switchThemeWithRipple(event, toggleTheme, nextIsDark) {
  const root = document.documentElement;
  if (reducedMotion()) {
    toggleTheme();
    return;
  }

  // Tâm vòng tròn = giữa nút vừa bấm; bán kính đủ phủ góc xa nhất màn hình
  const r = event.currentTarget.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  root.style.setProperty("--vt-x", `${x}px`);
  root.style.setProperty("--vt-y", `${y}px`);
  root.style.setProperty("--vt-r", `${radius}px`);
  root.classList.add("theme-switching"); // tạm dừng hiệu ứng nền nặng

  const apply = () => {
    root.classList.toggle("dark", nextIsDark);
    flushSync(toggleTheme);
  };
  const done = () => root.classList.remove("theme-switching", "theme-fade");

  if (document.startViewTransition) {
    document.startViewTransition(apply).finished.finally(done);
  } else {
    root.classList.add("theme-fade"); // trình duyệt cũ: màu chuyển dần
    apply();
    setTimeout(done, 700);
  }
}
