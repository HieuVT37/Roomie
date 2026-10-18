import { Router } from "express";
import StoredFile from "../models/StoredFile.js";
import { httpError, asyncHandler } from "../utils/httpError.js";

const NAME_RE = /^[0-9a-f]{24}\.webp$/;
const router = Router();

router.get(
  "/:name",
  asyncHandler(async (req, res) => {
    if (!NAME_RE.test(req.params.name)) throw httpError(404, "Không tìm thấy ảnh");

    const file = await StoredFile.findOne({ _id: req.params.name.slice(0, 24), kind: "public" }).select("data contentType");
    if (!file) throw httpError(404, "Không tìm thấy ảnh");

    res.set({
      "Content-Type": file.contentType,
      "Cache-Control": "public, max-age=31536000, immutable", // id ảnh không bao giờ đổi nội dung
      "X-Content-Type-Options": "nosniff",
    });
    res.send(file.data);
  })
);

export default router;