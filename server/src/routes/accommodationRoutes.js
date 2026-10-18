import { Router } from "express";
import {
  getMeta, listAccommodations, getAccommodation, myAccommodations,
  createAccommodation, updateAccommodation, setStatus, removeAccommodation,
} from "../controllers/accommodationController.js";
import { requireAuth, optionalAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { listingRules, statusRules } from "../validators/accommodationValidator.js";

const router = Router();

// Thứ tự quan trọng: các đường dẫn cố định phải đứng trước "/:id"
router.get("/meta", getMeta);
router.get("/mine", requireAuth, myAccommodations);
router.get("/", optionalAuth, listAccommodations);
router.get("/:id", optionalAuth, getAccommodation);

router.post("/", requireAuth, listingRules, validate, createAccommodation);
router.put("/:id", requireAuth, listingRules, validate, updateAccommodation);
router.patch("/:id/status", requireAuth, statusRules, validate, setStatus);
router.delete("/:id", requireAuth, removeAccommodation);

export default router;