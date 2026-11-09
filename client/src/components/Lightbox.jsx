import { useEffect, useRef } from "react";
import Icon from "./Icon";
import { slideOut, useTabDirection } from "../hooks/useMotion";

export default function Lightbox({ images, index, onClose, onChange }) {
  const total = images.length;
  const rootRef = useRef(null);
  const touch = useRef(null);
  // Hướng trượt của ảnh mới: sang ảnh sau thì trượt từ phải, ảnh trước thì từ trái
  const dir = useTabDirection(index);

  // Đóng: nền và ảnh mờ dần, trượt xuống nhẹ rồi mới gỡ khỏi trang
  const close = () => slideOut(rootRef.current, onClose, { y: 16, duration: 200 });

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") close();
      else if (total > 1 && e.key === "ArrowLeft")
        onChange((index - 1 + total) % total);
      else if (total > 1 && e.key === "ArrowRight")
        onChange((index + 1) % total);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const step = (e, delta) => {
    e.stopPropagation();
    onChange((index + delta + total) % total);
  };

  // Vuốt ngang trên điện thoại để chuyển ảnh
  const onTouchStart = (e) => {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e) => {
    const t = touch.current;
    touch.current = null;
    if (!t || total < 2) return;
    const dx = e.changedTouches[0].clientX - t.x;
    const dy = e.changedTouches[0].clientY - t.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) onChange((index + (dx < 0 ? 1 : -1) + total) % total);
  };

  return (
    <div
      ref={rootRef}
      className="overlay-in fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      onClick={close}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="dialog"
      aria-modal="true"
    >
      {/* Nút đóng */}
      <button
        type="button"
        onClick={close}
        aria-label="Đóng"
        className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-xl text-white transition hover:bg-white/35"
      >
        <Icon name="plus" size={22} className="rotate-45" />
      </button>

      {/* Ảnh và nút chuyển ảnh */}
      <div
        className="lightbox-stage relative flex max-h-[90vh] max-w-full items-center justify-center overflow-visible"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={images[index]}
          alt=""
          key={index}
          className={`block max-h-[90vh] max-w-full rounded-xl object-contain ${dir ? `slide-from-${dir}` : ""}`}
        />

        {total > 1 && (
          <>
            {/* Ảnh trước */}
            <button
              type="button"
              onClick={(e) => step(e, -1)}
              aria-label="Ảnh trước"
              className="absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-x-20 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-xl leading-none text-white backdrop-blur-sm transition hover:bg-white/35"
            >
              <Icon name="chevronLeft" size={22} />
            </button>

            {/* Ảnh tiếp theo */}
            <button
              type="button"
              onClick={(e) => step(e, 1)}
              aria-label="Ảnh sau"
              className="absolute right-0 top-1/2 z-10 flex h-10 w-10 translate-x-20 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-xl leading-none text-white backdrop-blur-sm transition hover:bg-white/35"
            >
              <Icon name="chevronRight" size={22} />
            </button>
          </>
        )}
      </div>

      {/* Số thứ tự ảnh */}
      {total > 1 && (
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
          {index + 1}/{total}
        </p>
      )}
    </div>
  );
}
