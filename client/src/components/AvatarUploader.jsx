import { useRef, useState } from "react";
import { uploadImagesApi } from "../api/uploads";
import Avatar from "./Avatar";
import Icon from "./Icon";

// Ảnh đại diện: chọn ảnh từ điện thoại (thư viện ảnh / máy ảnh) hoặc máy tính, tải lên server rồi trả về đường dẫn.
export default function AvatarUploader({ value, name, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // cho phép chọn lại cùng một file
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn một tệp ảnh");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const { urls } = await uploadImagesApi([file]);
      onChange(urls[0]);
    } catch (err) {
      setError(err.response?.data?.message || "Không tải được ảnh");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <p className="label">Ảnh đại diện</p>
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative">
          <Avatar src={value || null} name={name} size={80} />
          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-gray-900/55 text-xs font-medium text-white">
              Đang tải...
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="btn btn-secondary"
          >
            <Icon name="image" size={17} />
            {value ? "Đổi ảnh" : "Tải ảnh lên"}
          </button>
          {value && (
            <button type="button" onClick={() => onChange("")} disabled={uploading} className="btn btn-ghost">
              Xóa ảnh
            </button>
          )}
        </div>
      </div>
      <p className="hint mt-2">Ảnh JPG, PNG hoặc WebP từ điện thoại hoặc máy tính, tối đa 5MB.</p>
      {error && <p className="alert-error mt-2">{error}</p>}
    </div>
  );
}
