import multer from "multer";
import { httpError } from "../utils/httpError.js";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

const buildUploader = (maxFiles) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: maxFiles },
    fileFilter: (req, file, cb) =>
      ALLOWED.includes(file.mimetype) ? cb(null, true) : cb(httpError(400, "Chỉ chấp nhận ảnh JPG, PNG hoặc WebP")),
  }).array("images", maxFiles);

export const uploadImages = buildUploader(8);
export const uploadChatImages = buildUploader(4);