import { useEffect } from "react";

// Ghi khoảng cách giữa đáy trang và đáy vùng nhìn thấy vào biến CSS --vv-bottom
export default function useViewportBottom() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const layoutHeight = document.documentElement.clientHeight;
      const offset = Math.max(0, layoutHeight - (vv.offsetTop + vv.height));
      document.documentElement.style.setProperty("--vv-bottom", `${offset}px`);
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      window.removeEventListener("scroll", update);
    };
  }, []);
}