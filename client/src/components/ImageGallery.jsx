import { useEffect, useRef, useState } from "react";
import ImageFrame from "./ImageFrame";
import Lightbox from "./Lightbox";
import Icon from "./Icon";

// Nút mũi tên tròn hiện rõ khi rê chuột vào ảnh (luôn hiện trên điện thoại)
const arrowClass =
  "pointer-events-none absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-gray-900 shadow-[var(--shadow-soft)] backdrop-blur transition-all duration-200 group-hover:opacity-100 sm:opacity-0 dark:bg-gray-900/80 dark:text-white";

export default function ImageGallery({
  images = [],
  title = "",
  fallback = "home",
  children,
}) {
  const total = images.length;
  const [index, setIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const touch = useRef(null); // { x, y, dx, horizontal } khi đang kéo
  const dragged = useRef(false); // vừa kéo xong: bỏ qua cú bấm mở ảnh lớn
  const trackRef = useRef(null);
  const thumbs = useRef([]);

  const current = Math.min(index, Math.max(total - 1, 0));
  const go = (delta) => setIndex((i) => (i + delta + total) % total);

  // Tải trước ảnh kế bên để lướt không bị chờ
  useEffect(() => {
    if (total < 2) return;
    [1, -1].forEach((d) => {
      const img = new Image();
      img.src = images[(current + d + total) % total];
    });
  }, [current, images, total]);

  // Giữ ảnh nhỏ đang chọn luôn nằm trong vùng nhìn thấy
  useEffect(() => {
    thumbs.current[current]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [current]);

  // Vuốt ngang trên điện thoại: dải ảnh chạy theo ngón tay, thả ra thì trượt tới ảnh gần nhất
  const setOffset = (px) => {
    const el = trackRef.current;
    if (el) el.style.transform = `translateX(calc(${-current * 100}% + ${px}px))`;
  };
  const onTouchStart = (e) => {
    if (total < 2) return;
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dx: 0, horizontal: null };
  };
  const onTouchMove = (e) => {
    const t = touch.current;
    if (!t) return;
    const dx = e.touches[0].clientX - t.x;
    const dy = e.touches[0].clientY - t.y;
    // Quyết định hướng ở vài px đầu: kéo dọc thì để trang cuộn bình thường
    if (t.horizontal === null && Math.abs(dx) + Math.abs(dy) > 8) t.horizontal = Math.abs(dx) > Math.abs(dy);
    if (!t.horizontal) return;
    t.dx = dx;
    trackRef.current?.classList.add("dragging");
    // Ở ảnh đầu/cuối thì kéo nặng tay hơn (cảm giác chạm mép)
    const atEdge = (current === 0 && dx > 0) || (current === total - 1 && dx < 0);
    setOffset(atEdge ? dx * 0.35 : dx);
  };
  const onTouchEnd = () => {
    const t = touch.current;
    touch.current = null;
    if (!t || !t.horizontal) return;
    trackRef.current?.classList.remove("dragging");
    dragged.current = Math.abs(t.dx) > 6;
    const width = trackRef.current?.offsetWidth || 1;
    const next = Math.abs(t.dx) > width * 0.18 ? current + (t.dx < 0 ? 1 : -1) : current;
    if (next !== current && next >= 0 && next < total) setIndex(next);
    else setOffset(0); // chưa đủ xa: bật về ảnh hiện tại
  };
  const openViewer = () => {
    if (dragged.current) {
      dragged.current = false;
      return;
    }
    if (total) setViewerOpen(true);
  };

  return (
    <div className="space-y-3">
      <div
        className="group relative"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        {total > 1 ? (
          // Dải ảnh xếp ngang, trượt tới ảnh đang chọn
          <div className="overflow-hidden rounded-[1.25rem] [touch-action:pan-y]">
            <div
              ref={trackRef}
              className="gallery-track"
              style={{ transform: `translateX(${-current * 100}%)` }}
            >
              {images.map((url, i) => (
                <ImageFrame
                  key={url}
                  src={url}
                  alt={i === current ? title : ""}
                  ratio="aspect-[4/3] sm:aspect-[16/9]"
                  priority={i === current}
                  fallback={fallback}
                  onClick={i === current ? openViewer : undefined}
                />
              ))}
            </div>
          </div>
        ) : (
          <ImageFrame
            src={images[0]}
            alt={title}
            ratio="aspect-[4/3] sm:aspect-[16/9]"
            className="rounded-[1.25rem]"
            priority
            fallback={fallback}
            onClick={total ? openViewer : undefined}
          />
        )}

        {total > 1 && (
          <>
            {/* Bấm cạnh trái để xem ảnh trước */}
            <button
              type="button"
              aria-label="Ảnh trước"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              className="absolute inset-y-0 left-0 z-[5] w-1/4 cursor-w-resize"
            >
              <span className={`${arrowClass} left-3`}>
                <Icon name="chevronLeft" size={20} />
              </span>
            </button>

            {/* Bấm cạnh phải để xem ảnh tiếp theo */}
            <button
              type="button"
              aria-label="Ảnh sau"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              className="absolute inset-y-0 right-0 z-[5] w-1/4 cursor-e-resize"
            >
              <span className={`${arrowClass} right-3`}>
                <Icon name="chevronRight" size={20} />
              </span>
            </button>

            {/* Số thứ tự ảnh */}
            <span className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-full bg-gray-900/70 px-2.5 py-1 text-xs font-medium tabular-nums text-white backdrop-blur">
              {current + 1}/{total}
            </span>
          </>
        )}

        {children && (
          <div className="absolute right-3 top-3 z-10">{children}</div>
        )}
      </div>

      {total > 1 && (
        <div className="flex gap-2.5 overflow-x-auto p-1">
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              ref={(el) => (thumbs.current[i] = el)}
              onClick={() => setIndex(i)}
              aria-label={`Xem ảnh ${i + 1}`}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-xl transition-all duration-200 ${
                i === current
                  ? "ring-2 ring-brand ring-offset-2 ring-offset-canvas"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              <img
                src={url}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {viewerOpen && (
        <Lightbox
          images={images}
          index={current}
          onClose={() => setViewerOpen(false)}
          onChange={setIndex}
        />
      )}
    </div>
  );
}
