import { Router } from "express";
import StoredFile from "../models/StoredFile.js";
import { requireAuth } from "../middlewares/auth.js";
import { uploadImages } from "../middlewares/upload.js";
import { processImage } from "../services/imageService.js";
import { httpError, asyncHandler } from "../utils/httpError.js";

const MAX_PUBLIC_FILES_PER_USER = 80; // chống một người làm đầy database miễn phí

const router = Router();

router.post(
  "/images",
  requireAuth,
  uploadImages,
  asyncHandler(async (req, res) => {
    const files = req.files || [];
    if (!files.length) throw httpError(400, "Chưa chọn ảnh nào");

    const used = await StoredFile.countDocuments({ ownerId: req.user._id, kind: "public" });
    if (used + files.length > MAX_PUBLIC_FILES_PER_USER) {
      throw httpError(403, "Bạn đã tải lên quá nhiều ảnh, không thể tải thêm");
    }

    const urls = [];
    for (const f of files) {
      const { data, size } = await processImage(f.buffer);
      const doc = await StoredFile.create({ kind: "public", ownerId: req.user._id, contentType: "image/webp", size, data });
      urls.push(`/uploads/${doc._id}.webp`);
    }
    res.status(201).json({ urls });
  })
);

export default router;