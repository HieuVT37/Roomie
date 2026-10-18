import { Router } from "express";
import { listFaqs } from "../controllers/faqController.js";
import { createReport } from "../controllers/reportController.js";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { createReportRules } from "../validators/adminValidator.js";

const router = Router();

router.get("/faqs", listFaqs);
router.post("/reports", requireAuth, createReportRules, validate, createReport);

export default router;