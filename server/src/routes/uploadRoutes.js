import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { uploadImages } from "../middlewares/upload.js";
import { httpError } from "../utils/httpError.js";

const router = Router();

router.post("/images", requireAuth, uploadImages, (req, res) => {
  if (!req.files?.length) throw httpError(400, "Chưa chọn ảnh nào");
  res.status(201).json({ urls: req.files.map((f) => `/uploads/${f.filename}`) });
});

export default router;