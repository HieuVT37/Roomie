import { useRef, useState } from "react";
import { uploadImagesApi } from "../api/uploads";
import Icon from "./Icon";
import { IMAGE_ACCEPT, IMAGE_FORMATS_TEXT, MAX_IMAGE_MB, checkImageFile } from "../utils/imageFiles";

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
    const invalid = files.map(checkImageFile).find(Boolean);
    if (invalid) {
      setError(invalid);
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
          <div key={url} className="relative h-24 w-32 overflow-hidden rounded-xl border border-line">
            <img src={url} alt="" className="h-full w-full object-cover" />
            {showCover && i === 0 && (
              <span className="absolute left-1.5 top-1.5 rounded-md bg-gray-900/75 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur">Ảnh bìa</span>
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
            className="flex h-24 w-32 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line text-sm text-muted transition-colors hover:border-brand hover:bg-subtle hover:text-brand"
          >
            {!uploading && <Icon name="image" size={20} />}
            {uploading ? "Đang tải..." : "Thêm ảnh"}
          </button>
        )}
      </div>

      <input ref={inputRef} type="file" accept={IMAGE_ACCEPT} multiple onChange={handleFiles} className="hidden" />
      <p className="text-xs text-muted">{IMAGE_FORMATS_TEXT}, tối đa {MAX_IMAGE_MB}MB mỗi ảnh, tối đa {max} ảnh.</p>
      {error && <p className="text-sm text-red-600 dark:text-red-300">{error}</p>}
    </div>
  );
}