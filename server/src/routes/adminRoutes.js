import { Router } from "express";
import {
  stats, listUsers, updateUser, grantPlan, listListings, moderate, deleteListing, listReports, handleReport,
  listPlans, updatePlan, listFaqsAdmin, createFaq, updateFaq, deleteFaq,
} from "../controllers/adminController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
  userUpdateRules, grantPlanRules, moderationRules, handleReportRules, faqRules, planRules,
} from "../validators/adminValidator.js";

const router = Router();
router.use(requireAuth, requireRole("admin"));

router.get("/stats", stats);

router.get("/users", listUsers);
router.patch("/users/:id", userUpdateRules, validate, updateUser);
router.post("/users/:id/plan", grantPlanRules, validate, grantPlan);

router.get("/listings", listListings);
router.patch("/listings/:kind/:id/moderation", moderationRules, validate, moderate);
router.delete("/listings/:kind/:id", deleteListing);

router.get("/reports", listReports);
router.patch("/reports/:id", handleReportRules, validate, handleReport);

router.get("/plans", listPlans);
router.patch("/plans/:code", planRules, validate, updatePlan);

router.get("/faqs", listFaqsAdmin);
router.post("/faqs", faqRules, validate, createFaq);
router.put("/faqs/:id", faqRules, validate, updateFaq);
router.delete("/faqs/:id", deleteFaq);

export default router;