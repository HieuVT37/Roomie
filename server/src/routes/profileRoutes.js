import { Router } from "express";
import { getMyProfile, updateMyProfile } from "../controllers/profileController.js";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { profileRules } from "../validators/profileValidator.js";

const router = Router();
router.use(requireAuth);

router.get("/me", getMyProfile);
router.put("/me", profileRules, validate, updateMyProfile);

export default router;