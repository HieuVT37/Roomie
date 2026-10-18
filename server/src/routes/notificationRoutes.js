import { Router } from "express";
import { notificationSummary } from "../controllers/notificationController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();
router.get("/", requireAuth, notificationSummary);

export default router;
