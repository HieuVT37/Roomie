import { body } from "express-validator";

const ROOM_TYPES = ["single", "shared", "studio", "apartment", "house"];
const IMAGE_RE = /^(\/uploads\/[\w-]+\.(jpg|png|webp)|https?:\/\/\S+)$/;
const money = (path, label) =>
  body(path).optional().isInt({ min: 0, max: 1_000_000_000 }).withMessage(`${label} không hợp lệ`).toInt();

// Dùng cho cả tạo mới (POST) và cập nhật (PUT, gửi đầy đủ)
export const listingRules = [
  body("title").trim().isLength({ min: 5, max: 150 }).withMessage("Tiêu đề từ 5 đến 150 ký tự"),
  body("description").optional().isLength({ max: 5000 }).withMessage("Mô tả tối đa 5000 ký tự"),
  body("address.city").trim().notEmpty().withMessage("Vui lòng nhập thành phố"),
  body("address.district").trim().notEmpty().withMessage("Vui lòng nhập quận/huyện"),
  body("address.ward").optional().trim().isLength({ max: 100 }),
  body("address.street").optional().trim().isLength({ max: 200 }),
  body("price").isInt({ min: 0, max: 1_000_000_000 }).withMessage("Giá thuê không hợp lệ").toInt(),
  money("deposit", "Tiền cọc"),
  body("area").optional().isFloat({ min: 1, max: 1000 }).withMessage("Diện tích từ 1 đến 1000 m²").toFloat(),
  body("roomType").isIn(ROOM_TYPES).withMessage("Loại phòng không hợp lệ"),
  body("maxOccupants").optional().isInt({ min: 1, max: 20 }).withMessage("Số người tối đa không hợp lệ").toInt(),
  body("amenities").optional().isArray({ max: 30 }).withMessage("Tối đa 30 tiện nghi"),
  body("amenities.*").trim().isLength({ min: 1, max: 50 }),
  money("extraCosts.electricity", "Giá điện"),
  money("extraCosts.water", "Giá nước"),
  money("extraCosts.internet", "Phí internet"),
  body("extraCosts.other").optional().isLength({ max: 200 }),
  body("images").optional().isArray({ max: 8 }).withMessage("Tối đa 8 ảnh"),
  body("images.*").matches(IMAGE_RE).withMessage("Đường dẫn ảnh không hợp lệ"),
  body("rentalTerms").optional().isLength({ max: 2000 }),
  body("availableFrom").optional({ nullable: true }).isISO8601().withMessage("Ngày có thể dọn vào không hợp lệ").toDate(),
  body("contactPhone").optional({ nullable: true }).matches(/^[0-9+\s().-]{8,20}$/).withMessage("Số điện thoại không hợp lệ"),
];

export const statusRules = [
  body("status").isIn(["available", "rented", "stopped"]).withMessage("Trạng thái không hợp lệ"),
];

export const favoriteRules = [
  body("targetType").isIn(["accommodation", "pass"]).withMessage("Loại mục yêu thích không hợp lệ"),
  body("targetId").isMongoId().withMessage("Mã mục yêu thích không hợp lệ"),
];