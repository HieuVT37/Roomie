import { useEffect } from "react";

export default function Lightbox({ images, index, onClose, onChange }) {
  const total = images.length;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (total > 1 && e.key === "ArrowLeft") onChange((index - 1 + total) % total);
      else if (total > 1 && e.key === "ArrowRight") onChange((index + 1) % total);
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
      <button type="button" onClick={onClose} aria-label="Đóng"
        className="absolute right-4 top-4 rounded-full bg-white/20 px-3 py-1 text-xl text-white hover:bg-white/30">
        ✕
      </button>

      {total > 1 && (
        <button type="button" onClick={(e) => step(e, -1)} aria-label="Ảnh trước"
          className="absolute left-4 rounded-full bg-white/20 px-4 py-2 text-2xl text-white hover:bg-white/30">
          ‹
        </button>
      )}

      <img
        src={images[index]}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] max-w-full rounded-lg object-contain"
      />

      {total > 1 && (
        <>
          <button type="button" onClick={(e) => step(e, 1)} aria-label="Ảnh sau"
            className="absolute right-4 rounded-full bg-white/20 px-4 py-2 text-2xl text-white hover:bg-white/30">
            ›
          </button>
          <p className="absolute bottom-4 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
            {index + 1}/{total}
          </p>
        </>
      )}
    </div>
  );
}