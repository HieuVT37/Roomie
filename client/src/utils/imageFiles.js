// Quy định ảnh tải lên, khớp với server/src/middlewares/upload.js
export const MAX_IMAGE_MB = 10;
export const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;

// Gồm cả HEIC/HEIF của iPhone (liệt kê thêm đuôi tệp vì Windows không nhận ra kiểu HEIC)
export const IMAGE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,image/avif,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif,.avif";
export const IMAGE_FORMATS_TEXT = "JPG, PNG, WebP, HEIC (iPhone), AVIF hoặc GIF";

const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif", "image/avif"];
const EXT = /\.(jpe?g|png|webp|gif|heic|heif|avif)$/i;

// Trả về thông báo lỗi tiếng Việt, hoặc "" nếu tệp hợp lệ
export function checkImageFile(file) {
  if (!TYPES.includes(file.type) && !EXT.test(file.name || "")) return `Chỉ chấp nhận ảnh ${IMAGE_FORMATS_TEXT}`;
  if (file.size > MAX_IMAGE_BYTES) return `Mỗi ảnh tối đa ${MAX_IMAGE_MB}MB ("${file.name}" quá lớn)`;
  return "";
}
