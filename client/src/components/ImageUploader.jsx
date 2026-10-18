import { useRef, useState } from "react";
import { uploadImagesApi } from "../api/uploads";

export default function ImageUploader({ images, onChange, max = 8, showCover = true }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // cho phép chọn lại cùng một file
    if (!files.length) return;

    if (images.length + files.length > max) {
      setError(`Tối đa ${max} ảnh`);
      return;
    }
    setError("");
    setUploading(true);
    try {
      const { urls } = await uploadImagesApi(files);
      onChange([...images, ...urls]);
    } catch (err) {
      setError(err.response?.data?.message || "Không tải được ảnh");
    } finally {
      setUploading(false);
    }
  };

  const remove = (url) => onChange(images.filter((u) => u !== url));
  const makeCover = (url) => onChange([url, ...images.filter((u) => u !== url)]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {images.map((url, i) => (
          <div key={url} className="relative h-24 w-32 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <img src={url} alt="" className="h-full w-full object-cover" />
            {showCover && i === 0 && (
              <span className="absolute left-1 top-1 rounded bg-indigo-600 px-1 text-[10px] text-white">Ảnh bìa</span>
            )}
            <div className="absolute bottom-1 right-1 flex gap-1">
              {showCover && i !== 0 && (
                <button type="button" onClick={() => makeCover(url)} className="rounded bg-black/60 px-1 text-[10px] text-white">
                  Đặt bìa
                </button>
              )}
              <button type="button" onClick={() => remove(url)} className="rounded bg-red-600 px-1 text-[10px] text-white">
                Xóa
              </button>
            </div>
          </div>
        ))}

        {images.length < max && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="flex h-24 w-32 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-500 hover:border-indigo-500 dark:border-gray-600"
          >
            {uploading ? "Đang tải..." : "+ Thêm ảnh"}
          </button>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFiles} className="hidden" />
      <p className="text-xs text-gray-500 dark:text-gray-400">JPG, PNG hoặc WebP, tối đa 5MB mỗi ảnh, tối đa {max} ảnh.</p>
      {error && <p className="text-sm text-red-600 dark:text-red-300">{error}</p>}
    </div>
  );
}