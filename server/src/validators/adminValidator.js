import { body } from "express-validator";

const REASONS = ["spam", "scam", "fake_info", "harassment", "inappropriate", "duplicate", "other"];
const FAQ_CATEGORIES = ["account", "matching", "accommodation", "pass", "subscription", "safety"];
const LIMIT_KEYS = [
  "maxConnectionRequestsPerMonth", "maxMatchViewsPerDay", "maxActivePassListings",
  "maxActiveAccommodationListings", "featuredListingsPerMonth",
];

// Người dùng gửi báo cáo
export const createReportRules = [
  body("targetType").isIn(["user", "accommodation", "pass"]).withMessage("Loại đối tượng báo cáo không hợp lệ"),
  body("targetId").isMongoId().withMessage("Mã đối tượng không hợp lệ"),
  body("reason").isIn(REASONS).withMessage("Lý do báo cáo không hợp lệ"),
  body("detail").optional().trim().isLength({ max: 1000 }).withMessage("Mô tả tối đa 1000 ký tự"),
];

// Admin
export const userUpdateRules = [
  body("status").optional().isIn(["active", "suspended", "banned"]).withMessage("Trạng thái không hợp lệ"),
  body("isLandlord").optional().isBoolean().toBoolean(),
];

export const grantPlanRules = [
  body("planCode").isIn(["basic", "plus", "pro"]).withMessage("Gói không hợp lệ"),
  body("days").optional().isInt({ min: 1, max: 365 }).withMessage("Số ngày từ 1 đến 365").toInt(),
];

export const moderationRules = [
  body("status").isIn(["approved", "rejected"]).withMessage("Kết quả duyệt không hợp lệ"),
  body("note").if(body("status").equals("rejected")).trim()
    .isLength({ min: 3, max: 300 }).withMessage("Vui lòng nhập lý do từ chối (3-300 ký tự)"),
];

export const handleReportRules = [
  body("status").isIn(["reviewing", "resolved", "dismissed"]).withMessage("Trạng thái không hợp lệ"),
  body("resolution").if(body("status").isIn(["resolved", "dismissed"])).trim()
    .isLength({ min: 3, max: 500 }).withMessage("Vui lòng ghi chú kết quả xử lý (3-500 ký tự)"),
  body("action").optional().isIn(["none", "remove_content", "suspend_user"]).withMessage("Hành động không hợp lệ"),
];

export const faqRules = [
  body("question").trim().isLength({ min: 5, max: 300 }).withMessage("Câu hỏi từ 5 đến 300 ký tự"),
  body("answer").trim().isLength({ min: 1, max: 3000 }).withMessage("Câu trả lời từ 1 đến 3000 ký tự"),
  body("category").isIn(FAQ_CATEGORIES).withMessage("Danh mục không hợp lệ"),
  body("order").optional().isInt({ min: 0, max: 999 }).withMessage("Thứ tự từ 0 đến 999").toInt(),
  body("isPublished").optional().isBoolean().toBoolean(),
];

export const planRules = [
  body("price").optional().isInt({ min: 0, max: 100000000 }).withMessage("Giá không hợp lệ").toInt(),
  body("description").optional().isLength({ max: 300 }).withMessage("Mô tả tối đa 300 ký tự"),
  body("isActive").optional().isBoolean().toBoolean(),
  body("limits.canPostAccommodation").optional().isBoolean().toBoolean(),
  ...LIMIT_KEYS.map((k) =>
    body(`limits.${k}`).optional().isInt({ min: 0, max: 100000 }).withMessage("Hạn mức từ 0 đến 100000").toInt()
  ),
];