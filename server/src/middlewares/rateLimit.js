import rateLimit from "express-rate-limit";

const base = { standardHeaders: "draft-7", legacyHeaders: false };
const msg = (text) => ({ message: text, code: "RATE_LIMITED" });

// Toàn bộ API: nới rộng vì chat có polling liên tục
export const apiLimiter = rateLimit({
  ...base, windowMs: 60_000, limit: 600,
  message: msg("Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút"),
});

// Đăng nhập: chỉ đếm lần thất bại
export const loginLimiter = rateLimit({
  ...base, windowMs: 15 * 60_000, limit: 20, skipSuccessfulRequests: true,
  message: msg("Bạn đã đăng nhập sai quá nhiều lần, vui lòng thử lại sau 15 phút"),
});

export const registerLimiter = rateLimit({
  ...base, windowMs: 60 * 60_000, limit: 10,
  message: msg("Tạo tài khoản quá nhiều lần từ cùng một địa chỉ, vui lòng thử lại sau"),
});