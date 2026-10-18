import { Router } from "express";
import { listMatches, getMatchDetail } from "../controllers/matchingController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", listMatches);
router.get("/:userId", getMatchDetail);

export default router;