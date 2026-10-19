import { useEffect } from "react";

export default function Lightbox({ images, index, onClose, onChange }) {
  const total = images.length;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (total > 1 && e.key === "ArrowLeft")
        onChange((index - 1 + total) % total);
      else if (total > 1 && e.key === "ArrowRight")
        onChange((index + 1) % total);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, total, onClose, onChange]);

  const step = (e, delta) => {
    e.stopPropagation();
    onChange((index + delta + total) % total);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Nút đóng */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng"
        className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-xl text-white transition hover:bg-white/35"
      >
        ✕
      </button>

      {/* Ảnh và nút chuyển ảnh */}
      <div
        className="relative flex max-h-[90vh] max-w-full items-center justify-center overflow-visible"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={images[index]}
          alt=""
          className="block max-h-[90vh] max-w-full rounded-lg object-contain"
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
              ‹
            </button>

            {/* Ảnh tiếp theo */}
            <button
              type="button"
              onClick={(e) => step(e, 1)}
              aria-label="Ảnh sau"
              className="absolute right-0 top-1/2 z-10 flex h-10 w-10 translate-x-20 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-xl leading-none text-white backdrop-blur-sm transition hover:bg-white/35"
            >
              ›
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
