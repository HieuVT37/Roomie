import { useState } from "react";
import { createPortal } from "react-dom";
import Lightbox from "./Lightbox";

// Ảnh đại diện tròn; không có ảnh thì hiện chữ cái đầu của tên.
// `zoomable`: bấm vào để xem ảnh lớn (chỉ bật ở chỗ avatar không nằm trong link/nút khác).
export default function Avatar({ src, name, size = 56, zoomable = false }) {
  const [open, setOpen] = useState(false);
  const style = { width: size, height: size };

  if (!src) {
    return (
      <div
        style={style}
        className="flex shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
      >
        {(name || "?").charAt(0).toUpperCase()}
      </div>
    );
  }

  const img = <img src={src} alt={name} style={style} loading="lazy" className="shrink-0 rounded-full object-cover" />;
  if (!zoomable) return img;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Xem ảnh đại diện của ${name || "người dùng"}`}
        className="shrink-0 cursor-zoom-in rounded-full transition-transform duration-200 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {img}
      </button>
      {/* Đưa ra ngoài <body> để lớp phủ toàn màn hình không bị khung cha (có hiệu ứng transform) cắt mất */}
      {open && createPortal(<Lightbox images={[src]} index={0} onClose={() => setOpen(false)} onChange={() => {}} />, document.body)}
    </>
  );
}
