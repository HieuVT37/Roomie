import fs from "node:fs";
import crypto from "node:crypto";
import multer from "multer";
import { UPLOAD_DIR, CHAT_DIR } from "../config/paths.js";
import { httpError } from "../utils/httpError.js";

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(CHAT_DIR, { recursive: true });

const ALLOWED = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };

const buildUploader = (dir, maxFiles) =>
  multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, dir),
      // Tên file ngẫu nhiên, không dùng tên người dùng gửi lên (tránh ghi đè và path traversal)
      filename: (req, file, cb) => cb(null, crypto.randomUUID() + ALLOWED[file.mimetype]),
    }),
    limits: { fileSize: 5 * 1024 * 1024, files: maxFiles },
    fileFilter: (req, file, cb) =>
      ALLOWED[file.mimetype] ? cb(null, true) : cb(httpError(400, "Chỉ chấp nhận ảnh JPG, PNG hoặc WebP")),
  }).array("images", maxFiles);

export const uploadImages = buildUploader(UPLOAD_DIR, 8);
export const uploadChatImages = buildUploader(CHAT_DIR, 4);

// Đặt TRƯỚC middleware multer: nếu request kết thúc bằng lỗi thì xóa các file vừa tải lên
export function cleanupUploadsOnError(req, res, next) {
  res.on("finish", () => {
    if (res.statusCode >= 400 && req.files?.length) {
      for (const f of req.files) fs.unlink(f.path, () => {});
    }
  });
  next();
}