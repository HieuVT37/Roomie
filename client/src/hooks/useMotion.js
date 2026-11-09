import { useEffect, useLayoutEffect, useState } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// =====================================================================
// Hệ thống chuyển động "slide" dùng chung. Chỉ animate transform/opacity,
// cùng đường cong --ease-out-soft, tắt hết khi người dùng chọn giảm chuyển động.
// =====================================================================

export const EASE = "cubic-bezier(0.22, 1, 0.36, 1)"; // = --ease-out-soft trong index.css
const DISTANCE = 28; // px trượt

export const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Trượt một phần tử vào từ hướng cho trước (Web Animations API, không đổi DOM/state)
export function slideIn(el, { x = 0, y = 0, duration = 380 } = {}) {
  if (!el || reducedMotion() || !el.animate) return;
  el.animate(
    [
      { opacity: 0, transform: `translate(${x}px, ${y}px)` },
      { opacity: 1, transform: "none" },
    ],
    { duration, easing: EASE },
  );
}

// Trượt một phần tử ra rồi mới gọi `done` (dùng khi đóng form, hộp thoại)
export function slideOut(el, done, { x = 0, y = -12, duration = 220 } = {}) {
  if (!el || reducedMotion() || !el.animate) {
    done();
    return;
  }
  const anim = el.animate(
    [
      { opacity: 1, transform: "none" },
      { opacity: 0, transform: `translate(${x}px, ${y}px)` },
    ],
    { duration, easing: EASE, fill: "forwards" },
  );
  anim.onfinish = done;
}

const depth = (path) => path.split("/").filter(Boolean).length;

// 1. Chuyển trang: nội dung mới trượt vào theo hướng điều hướng.
//    Vào sâu hơn (danh sách → chi tiết): từ phải; Quay lại / Back: từ trái; cùng cấp: trượt lên nhẹ.
//    `group` gom các route con không cần trượt cả khung (ví dụ mọi trang /admin/*).
export function useRouteSlide(ref, group = (p) => p) {
  const { pathname } = useLocation();
  const navType = useNavigationType();
  const key = group(pathname);
  const [prev, setPrev] = useState({ key, path: pathname });

  // Ghi nhớ trang trước trong lúc render (cách React khuyến nghị thay vì ref)
  if (prev.key !== key) {
    const deeper = depth(pathname) - depth(prev.path);
    const dir = navType === "POP" || deeper < 0 ? "back" : deeper > 0 ? "forward" : "same";
    setPrev({ key, path: pathname, dir });
  }
  const pending = prev.dir;

  useLayoutEffect(() => {
    if (!pending) return;
    const x = pending === "forward" ? DISTANCE : pending === "back" ? -DISTANCE : 0;
    slideIn(ref.current, { x, y: pending === "same" ? 14 : 0, duration: 420 });
  }, [key, pending, ref]);
}

// 3a. Tab: một gạch chân trượt theo tab đang chọn (đặt biến CSS trên thanh tab)
export function useTabIndicator(listRef, activeKey) {
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return undefined;
    const place = () => {
      const tab = list.querySelector('[role="tab"][aria-selected="true"]');
      if (!tab) return;
      list.style.setProperty("--tab-x", `${tab.offsetLeft}px`);
      list.style.setProperty("--tab-w", `${tab.offsetWidth}px`);
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(list);
    return () => ro.disconnect();
  }, [listRef, activeKey]);
}

// 3b. Tab: hướng trượt của nội dung ("left" | "right") khi đổi sang tab bên trái / bên phải
export function useTabDirection(index) {
  const [state, setState] = useState({ index, dir: "" });
  if (state.index !== index) {
    setState({ index, dir: index > state.index ? "right" : "left" });
  }
  return state.dir;
}

// 4. Trượt lên khi cuộn tới: áp dụng cho [data-reveal] và thẻ trong lưới .stagger.
//    Phần tử đã nằm trong màn hình lúc xuất hiện thì KHÔNG bị ẩn (không nhấp nháy);
//    chỉ phần tử ở dưới màn hình mới chờ và trượt lên khi cuộn tới, một lần.
export function useRevealOnScroll(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion() || !("IntersectionObserver" in window)) return undefined;

    const seen = new WeakSet();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const el = e.target;
          if (!seen.has(el)) {
            seen.add(el);
            if (!e.isIntersecting) el.classList.add("reveal-pending");
            else io.unobserve(el);
            continue;
          }
          if (e.isIntersecting) {
            el.classList.add("is-revealed");
            io.unobserve(el);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );

    const scan = () => root.querySelectorAll("[data-reveal], .stagger > *").forEach((el) => {
      if (!seen.has(el)) io.observe(el);
    });
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(root, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [rootRef]);
}
