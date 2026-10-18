import sharp from "sharp";
import { httpError } from "../utils/httpError.js";

const ALLOWED_FORMATS = ["jpeg", "png", "webp"];

// Trả về ảnh WebP tối đa 1600px, thường chỉ vài trăm KB
export async function processImage(buffer) {
  try {
    const meta = await sharp(buffer, { limitInputPixels: 40_000_000 }).metadata();
    if (!ALLOWED_FORMATS.includes(meta.format)) throw new Error("format");

    const { data, info } = await sharp(buffer, { limitInputPixels: 40_000_000 })
      .rotate() // xoay đúng chiều theo thông tin chụp
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer({ resolveWithObject: true });
    return { data, size: info.size };
  } catch {
    throw httpError(400, "Tệp tải lên không phải ảnh hợp lệ");
  }
}