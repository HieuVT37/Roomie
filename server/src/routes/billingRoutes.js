import { Router } from "express";
import { getPlans, myBilling, checkout, simulatePayment } from "../controllers/billingController.js";
import { requireAuth, optionalAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { checkoutRules, simulateRules } from "../validators/billingValidator.js";

const router = Router();

router.get("/plans", optionalAuth, getPlans);
router.get("/me", requireAuth, myBilling);
router.post("/checkout", requireAuth, checkoutRules, validate, checkout);
router.post("/payments/:id/simulate", requireAuth, simulateRules, validate, simulatePayment);

export default router;