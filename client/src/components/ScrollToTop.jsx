import { useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { isReturningTo } from "../utils/lastViewed";

if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

export default function ScrollToTop() {
  const location = useLocation();
  const navType = useNavigationType();

  useLayoutEffect(() => {
    // Quay lại danh sách vừa xem: để trang danh sách tự cuộn đến thẻ đó
    if (isReturningTo(location.pathname + location.search, navType)) return;

    const toTop = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    toTop();
    const timers = [50, 150, 400].map((ms) => setTimeout(toTop, ms));
    return () => timers.forEach(clearTimeout);
  }, [location.key]);

  return null;
}