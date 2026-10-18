import { Router } from "express";
import authRoutes from "./authRoutes.js";
import profileRoutes from "./profileRoutes.js";
import matchingRoutes from "./matchingRoutes.js";
import connectionRoutes from "./connectionRoutes.js";
import conversationRoutes from "./conversationRoutes.js";
import accommodationRoutes from "./accommodationRoutes.js";
import passRoutes from "./passRoutes.js";
import favoriteRoutes from "./favoriteRoutes.js";
import uploadRoutes from "./uploadRoutes.js";
import billingRoutes from "./billingRoutes.js";
import supportRoutes from "./supportRoutes.js";
import adminRoutes from "./adminRoutes.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ ok: true, service: "roomie-api", time: new Date() });
});

router.use("/auth", authRoutes);
router.use("/profiles", profileRoutes);
router.use("/matching", matchingRoutes);
router.use("/connections", connectionRoutes);
router.use("/conversations", conversationRoutes);
router.use("/accommodations", accommodationRoutes);
router.use("/pass", passRoutes);
router.use("/favorites", favoriteRoutes);
router.use("/uploads", uploadRoutes);
router.use("/billing", billingRoutes);
router.use("/support", supportRoutes);
router.use("/admin", adminRoutes);

export default router;