import { body } from "express-validator";

const CRITERIA = ["budget", "location", "schedule", "cleanliness", "lifestyle", "privacy", "sharedSpace", "interests"];
const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;
const ROOM_PHOTO_RE = /^\/uploads\/[\w-]+\.(jpg|png|webp)$/;
const scale = (path, label) =>
  body(path).optional().isInt({ min: 1, max: 5 }).withMessage(`${label} phải từ 1 đến 5`).toInt();

export const profileRules = [
  body("displayName").optional().trim().notEmpty().withMessage("Tên hiển thị không được để trống")
    .isLength({ max: 60 }).withMessage("Tên hiển thị tối đa 60 ký tự"),
  body("avatarUrl").optional({ nullable: true }).isURL().withMessage("Ảnh đại diện phải là đường dẫn hợp lệ"),
  body("bio").optional().isLength({ max: 500 }).withMessage("Giới thiệu tối đa 500 ký tự"),
  body("gender").optional({ nullable: true }).isIn(["male", "female", "other", "private"]).withMessage("Giới tính không hợp lệ"),
  body("birthYear").optional({ nullable: true })
    .isInt({ min: 1950, max: new Date().getFullYear() - 16 }).withMessage("Năm sinh không hợp lệ").toInt(),
  body("school").optional({ nullable: true }).isLength({ max: 100 }).withMessage("Tên trường tối đa 100 ký tự"),
  body("occupation").optional({ nullable: true }).isLength({ max: 100 }).withMessage("Nghề nghiệp tối đa 100 ký tự"),
  body("isLookingForRoommate").optional().isBoolean().toBoolean(),
  body("visibility.*").optional().isBoolean().toBoolean(),
  body("roomPhotos").optional().isArray({ max: 6 }).withMessage("Tối đa 6 ảnh phòng"),
  body("roomPhotos.*").matches(ROOM_PHOTO_RE).withMessage("Đường dẫn ảnh không hợp lệ"),

  body("preferences.city").optional().trim().notEmpty().withMessage("Vui lòng nhập thành phố"),
  body("preferences.locations").optional().isArray({ max: 10 }).withMessage("Tối đa 10 khu vực"),
  body("preferences.locations.*").trim().notEmpty().isLength({ max: 50 }),
  body("preferences.budget.min").optional().isInt({ min: 0 }).withMessage("Ngân sách tối thiểu không hợp lệ").toInt(),
  body("preferences.budget.max").optional().isInt({ min: 0 }).withMessage("Ngân sách tối đa không hợp lệ").toInt(),
  body("preferences.budget").optional()
    .custom((b) => Number(b.max) >= Number(b.min)).withMessage("Ngân sách tối đa phải lớn hơn hoặc bằng tối thiểu"),
  body("preferences.schedule.sleepTime").optional().matches(timeRe).withMessage("Giờ ngủ phải có dạng HH:mm"),
  body("preferences.schedule.wakeTime").optional().matches(timeRe).withMessage("Giờ thức phải có dạng HH:mm"),
  body("preferences.schedule.pattern").optional().isIn(["student", "office", "freelance", "shift"]),
  scale("preferences.cleanliness", "Mức độ sạch sẽ"),
  scale("preferences.noiseLevel", "Mức độ ồn"),
  scale("preferences.privacyNeed", "Nhu cầu riêng tư"),
  body("preferences.guestFrequency").optional().isIn(["never", "rarely", "sometimes", "often"]),
  body("preferences.sharedSpaceUsage").optional().isIn(["minimal", "moderate", "open"]),
  body("preferences.smoking").optional().isBoolean().toBoolean(),
  body("preferences.pets").optional().isBoolean().toBoolean(),
  body("preferences.interests").optional().isArray({ max: 20 }).withMessage("Tối đa 20 sở thích"),
  body("preferences.interests.*").trim().isLength({ max: 50 }),
  body("preferences.requirements").optional().isArray({ max: 20 }).withMessage("Tối đa 20 yêu cầu"),
  body("preferences.requirements.*").trim().isLength({ max: 100 }),
  body("preferences.weights.*").optional().isInt({ min: 1, max: 5 }).withMessage("Trọng số phải từ 1 đến 5").toInt(),
  body("preferences.dealBreakers").optional().isArray(),
  body("preferences.dealBreakers.*").isIn(CRITERIA).withMessage("Tiêu chí bắt buộc không hợp lệ"),
];