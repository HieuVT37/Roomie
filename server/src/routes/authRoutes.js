import { Router } from "express";
import {
  register, login, logout, me, verifyEmail, resendVerification, forgotPassword, resetPassword, changePassword,
} from "../controllers/authController.js";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { loginLimiter, registerLimiter, otpSendLimiter, otpVerifyLimiter } from "../middlewares/rateLimit.js";
import {
  registerRules, loginRules, emailOnlyRules, verifyEmailRules, resetPasswordRules, changePasswordRules,
} from "../validators/authValidator.js";

const router = Router();

router.post("/register", registerLimiter, registerRules, validate, register);
router.post("/verify-email", otpVerifyLimiter, verifyEmailRules, validate, verifyEmail);
router.post("/resend-verification", otpSendLimiter, emailOnlyRules, validate, resendVerification);
router.post("/login", loginLimiter, loginRules, validate, login);
router.post("/forgot-password", otpSendLimiter, emailOnlyRules, validate, forgotPassword);
router.post("/reset-password", otpVerifyLimiter, resetPasswordRules, validate, resetPassword);
router.post("/change-password", requireAuth, changePasswordRules, validate, changePassword);
router.post("/logout", logout);
router.get("/me", requireAuth, me);

export default router;
