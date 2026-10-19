import { useEffect, useRef, useState } from "react";
import ImageFrame from "./ImageFrame";
import Lightbox from "./Lightbox";

const arrowClass =
  "absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-2xl leading-none text-white backdrop-blur-sm transition hover:bg-black/55 focus:outline-none focus-visible:ring-2 focus-visible:ring-white";

export default function ImageGallery({
  images = [],
  title = "",
  fallback = "🏠",
  children,
}) {
  const total = images.length;
  const [index, setIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const touch = useRef(null);
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

  // Vuốt ngang trên điện thoại
  const onTouchStart = (e) => {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e) => {
    if (!touch.current || total < 2) return;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const dy = e.changedTouches[0].clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
  };

  return (
    <div className="space-y-2">
      <div
        className="relative"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <ImageFrame
          src={images[current]}
          alt={title}
          ratio="aspect-[4/3] sm:aspect-[16/9]"
          className="rounded-2xl"
          priority
          fallback={fallback}
          onClick={total ? () => setViewerOpen(true) : undefined}
        />

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
            />

            {/* Bấm cạnh phải để xem ảnh tiếp theo */}
            <button
              type="button"
              aria-label="Ảnh sau"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              className="absolute inset-y-0 right-0 z-[5] w-1/4 cursor-e-resize"
            />
          </>
        )}

        {children && (
          <div className="absolute right-3 top-3 z-10">{children}</div>
        )}
      </div>

      {total > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              ref={(el) => (thumbs.current[i] = el)}
              onClick={() => setIndex(i)}
              aria-label={`Xem ảnh ${i + 1}`}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${
                i === current
                  ? "border-indigo-600"
                  : "border-transparent opacity-80 hover:opacity-100"
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
