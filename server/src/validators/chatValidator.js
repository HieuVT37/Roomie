import { body } from "express-validator";

export const sendRequestRules = [
  body("receiverId").isMongoId().withMessage("Mã người nhận không hợp lệ"),
  body("message").optional({ nullable: true }).trim().isLength({ max: 300 }).withMessage("Lời nhắn tối đa 300 ký tự"),
];

export const startConversationRules = [
  body("userId").isMongoId().withMessage("Mã người dùng không hợp lệ"),
];

export const sendMessageRules = [
  body("text").optional().isString().trim().isLength({ max: 2000 }).withMessage("Tin nhắn tối đa 2000 ký tự"),
];