import { body } from "express-validator";

export const checkoutRules = [
  body("planCode").isIn(["plus", "pro"]).withMessage("Gói không hợp lệ"),
  body("method").isIn(["momo", "vnpay", "zalopay", "bank_transfer", "card"]).withMessage("Phương thức thanh toán không hợp lệ"),
];

export const simulateRules = [
  body("result").isIn(["success", "failed", "cancel"]).withMessage("Kết quả thanh toán không hợp lệ"),
];