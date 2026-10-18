import { body } from "express-validator";

export const registerRules = [
  body("email").isEmail().withMessage("Email không hợp lệ").normalizeEmail(),
  body("password")
    .isLength({ min: 8 }).withMessage("Mật khẩu tối thiểu 8 ký tự")
    .matches(/[A-Za-z]/).withMessage("Mật khẩu cần có chữ cái")
    .matches(/\d/).withMessage("Mật khẩu cần có chữ số"),
  body("displayName").trim().notEmpty().withMessage("Vui lòng nhập tên hiển thị").isLength({ max: 60 }),
];

export const loginRules = [
  body("email").isEmail().withMessage("Email không hợp lệ").normalizeEmail(),
  body("password").notEmpty().withMessage("Vui lòng nhập mật khẩu"),
];