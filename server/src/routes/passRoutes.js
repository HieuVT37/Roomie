import { Router } from "express";
import {
  listPass, getPass, myPass, createPass, updatePass, setPassStatus, removePass,
} from "../controllers/passController.js";
import { requireAuth, optionalAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { passRules, passStatusRules } from "../validators/passValidator.js";

const router = Router();

// Thứ tự quan trọng: "/mine" phải đứng trước "/:id"
router.get("/mine", requireAuth, myPass);
router.get("/", optionalAuth, listPass);
router.get("/:id", optionalAuth, getPass);

router.post("/", requireAuth, passRules, validate, createPass);
router.put("/:id", requireAuth, passRules, validate, updatePass);
router.patch("/:id/status", requireAuth, passStatusRules, validate, setPassStatus);
router.delete("/:id", requireAuth, removePass);

export default router;