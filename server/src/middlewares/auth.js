import User from "../models/User.js";
import { verifyToken } from "../utils/token.js";
import { ensurePlanFresh } from "../services/billingService.js";
import { httpError, asyncHandler } from "../utils/httpError.js";

// Đọc token từ cookie (web) hoặc header Authorization: Bearer (mobile sau này)
const getToken = (req) => {
  const header = req.headers.authorization;
  return req.cookies?.token || (header?.startsWith("Bearer ") ? header.slice(7) : null);
};

export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = getToken(req);
  if (!token) throw httpError(401, "Bạn chưa đăng nhập");

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw httpError(401, "Phiên đăng nhập không hợp lệ hoặc đã hết hạn");
  }

  const user = await User.findById(payload.sub);
  if (!user) throw httpError(401, "Tài khoản không tồn tại");
  if (user.status !== "active") throw httpError(403, "Tài khoản đang bị khóa hoặc chưa kích hoạt");

  await ensurePlanFresh(user);
  req.user = user;
  next();
});

// Dùng cho trang công khai nhưng muốn biết người xem là ai (nếu có)
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = getToken(req);
  if (!token) return next();
  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);
    if (user && user.status === "active") {
      await ensurePlanFresh(user);
      req.user = user;
    }
  } catch {
    // token sai hoặc hết hạn: coi như chưa đăng nhập
  }
  next();
});

export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(httpError(403, "Bạn không có quyền thực hiện thao tác này"));
    }
    next();
  };