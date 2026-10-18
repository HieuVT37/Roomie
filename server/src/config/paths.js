import { fileURLToPath } from "node:url";

// Ảnh công khai (tin phòng, Pass, ảnh phòng trong hồ sơ): được phục vụ tĩnh qua /uploads
export const UPLOAD_DIR = fileURLToPath(new URL("../../uploads", import.meta.url));

// Ảnh tin nhắn: KHÔNG nằm trong UPLOAD_DIR, chỉ tải được qua API có kiểm tra quyền
export const CHAT_DIR = fileURLToPath(new URL("../../uploads-private/chat", import.meta.url));