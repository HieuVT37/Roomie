import { body } from "express-validator";

const IMAGE_RE = /^(\/uploads\/[\w-]+\.(jpg|png|webp)|https?:\/\/\S+)$/;
const isRoom = body("type").equals("room");
const isItem = body("type").equals("item");

// Dùng cho cả tạo mới (POST) và cập nhật (PUT, gửi đầy đủ)
export const passRules = [
  body("type").isIn(["room", "item"]).withMessage("Loại bài không hợp lệ"),
  body("title").trim().isLength({ min: 3, max: 150 }).withMessage("Tiêu đề từ 3 đến 150 ký tự"),
  body("description").optional().isLength({ max: 3000 }).withMessage("Mô tả tối đa 3000 ký tự"),
  body("price").optional({ nullable: true }).isInt({ min: 0, max: 1_000_000_000 }).withMessage("Giá không hợp lệ").toInt(),
  body("area").optional().trim().isLength({ max: 100 }).withMessage("Khu vực tối đa 100 ký tự"),
  body("contact").optional({ nullable: true }).trim().isLength({ max: 100 }).withMessage("Thông tin liên hệ tối đa 100 ký tự"),
  body("images").optional().isArray({ max: 8 }).withMessage("Tối đa 8 ảnh"),
  body("images.*").matches(IMAGE_RE).withMessage("Đường dẫn ảnh không hợp lệ"),

  // Pass Room
  body("roomInfo").if(isRoom).exists().withMessage("Thiếu thông tin phòng"),
  body("roomInfo.address").if(isRoom).trim().notEmpty().withMessage("Vui lòng nhập địa chỉ phòng").isLength({ max: 200 }),
  body("roomInfo.deposit").if(isRoom).optional().isInt({ min: 0, max: 1_000_000_000 }).withMessage("Tiền cọc không hợp lệ").toInt(),
  body("roomInfo.remainingLeaseMonths").if(isRoom).isInt({ min: 0, max: 120 }).withMessage("Số tháng hợp đồng còn lại từ 0 đến 120").toInt(),
  body("roomInfo.availableFrom").if(isRoom).optional({ nullable: true }).isISO8601().withMessage("Ngày bàn giao không hợp lệ").toDate(),
  body("roomInfo.landlordAgreed").if(isRoom).optional().isBoolean().toBoolean(),
  body("roomInfo.transferTerms").if(isRoom).optional().isLength({ max: 1000 }).withMessage("Điều khoản chuyển nhượng tối đa 1000 ký tự"),

  // Pass Items
  body("itemInfo").if(isItem).exists().withMessage("Thiếu thông tin món đồ"),
  body("itemInfo.category").if(isItem).isIn(["furniture", "appliance", "kitchen", "storage", "other"]).withMessage("Danh mục không hợp lệ"),
  body("itemInfo.condition").if(isItem).isIn(["new", "like_new", "good", "fair", "old"]).withMessage("Tình trạng không hợp lệ"),
  body("itemInfo.dealType").if(isItem).isIn(["sell", "give_away", "exchange"]).withMessage("Hình thức không hợp lệ"),
];

export const passStatusRules = [
  body("status").isIn(["active", "completed", "closed"]).withMessage("Trạng thái không hợp lệ"),
];