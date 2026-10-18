import { Router } from "express";
import {
  sendRequest, listConnections, summary, accept, reject, cancel, disconnect, block, unblock, markSeen,
} from "../controllers/connectionController.js";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { sendRequestRules } from "../validators/chatValidator.js";

const router = Router();
router.use(requireAuth);

router.get("/", listConnections);
router.get("/summary", summary);
router.post("/seen", markSeen);
router.post("/", sendRequestRules, validate, sendRequest);

router.patch("/:id/accept", accept);
router.patch("/:id/reject", reject);
router.patch("/:id/cancel", cancel);
router.delete("/:id", disconnect);

router.post("/block/:userId", block);
router.delete("/block/:userId", unblock);

export default router;