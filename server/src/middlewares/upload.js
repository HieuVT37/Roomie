import multer from "multer";
import { httpError } from "../utils/httpError.js";

export const MAX_IMAGE_MB = 10;

// Định dạng ảnh phổ thông, gồm cả HEIC/HEIF của iPhone. Máy tính Windows thường không nhận diện
// được HEIC nên trình duyệt gửi kiểu rỗng hoặc application/octet-stream -> xét thêm đuôi tệp.
// Nội dung thật của ảnh vẫn được kiểm tra lại ở services/imageService.js.
const ALLOWED_TYPES = [
  "image/jpeg", "image/jpg", "image/pjpeg", "image/png", "image/webp", "image/gif",
  "image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence", "image/avif",
];
const ALLOWED_EXT = /\.(jpe?g|png|webp|gif|heic|heif|avif)$/i;

const isAllowed = (file) => ALLOWED_TYPES.includes(file.mimetype) || ALLOWED_EXT.test(file.originalname || "");

const buildUploader = (maxFiles) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_IMAGE_MB * 1024 * 1024, files: maxFiles },
    fileFilter: (req, file, cb) =>
      isAllowed(file)
        ? cb(null, true)
        : cb(httpError(400, "Chỉ chấp nhận ảnh JPG, PNG, WebP, HEIC (iPhone), AVIF hoặc GIF")),
  }).array("images", maxFiles);

export const uploadImages = buildUploader(8);
export const uploadChatImages = buildUploader(4);
