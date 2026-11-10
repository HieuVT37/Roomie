import { Router } from "express";
import rateLimit from "express-rate-limit";
import { listMatches, getMatchDetail, getMatchInsightHandler, createMatchInsightHandler } from "../controllers/matchingController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();
router.use(requireAuth);

// Tạo nhận xét AI gọi Gemini: chặn bấm liên tục (hạn mức ngày theo gói nằm ở matchInsightService)
const insightLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user._id),
  message: { message: "Bạn yêu cầu nhận xét AI quá nhanh, vui lòng thử lại sau ít phút", code: "RATE_LIMITED" },
});

router.get("/", listMatches);
router.get("/:userId/insight", getMatchInsightHandler);
router.post("/:userId/insight", insightLimiter, createMatchInsightHandler);
router.get("/:userId", getMatchDetail);

export default router;
