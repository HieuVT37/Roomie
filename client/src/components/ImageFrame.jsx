import { useState } from "react";

// Khung ảnh chuẩn: tỉ lệ cố định, ảnh hiện trọn vẹn không méo, phần thừa là nền mờ.
export default function ImageFrame({
  src,
  alt = "",
  ratio = "aspect-[4/3]",
  priority = false, // true cho ảnh chính ở trang chi tiết (tải ngay)
  fallback = "🏠",
  className = "",
  onClick,
  children,
}) {
  const [failedSrc, setFailedSrc] = useState(null);
  const showImg = src && failedSrc !== src;
  const clickable = typeof onClick === "function";
  const loading = priority ? "eager" : "lazy";

  return (
    <div
      onClick={onClick}
      onKeyDown={clickable ? (e) => (e.key === "Enter" || e.key === " ") && onClick() : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      className={`relative overflow-hidden bg-gray-100 dark:bg-gray-800 ${ratio} ${
        clickable ? "cursor-zoom-in" : ""
      } ${className}`}
    >
      {showImg ? (
        <>
          {/* Nền mờ lấp phần trống */}
          <img
            src={src}
            alt=""
            aria-hidden="true"
            loading={loading}
            decoding="async"
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-xl"
          />
          {/* Ảnh thật: hiện đủ, giữ đúng tỉ lệ */}
          <img
            src={src}
            alt={alt}
            loading={loading}
            decoding="async"
            onError={() => setFailedSrc(src)}
            className="relative h-full w-full object-contain"
          />
        </>
      ) : (
        <div className="flex h-full items-center justify-center text-5xl">{fallback}</div>
      )}
      {children}
    </div>
  );
}