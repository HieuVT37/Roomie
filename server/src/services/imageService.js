import sharp from "sharp";
import heicConvert from "heic-convert";
import { httpError } from "../utils/httpError.js";

const ALLOWED_FORMATS = ["jpeg", "png", "webp", "gif", "heif"];
const PIXEL_LIMIT = 100_000_000; // đủ cho ảnh 48MP của iPhone đời mới

// Nhận diện HEIC/HEIF theo phần đầu tệp ("ftyp" + brand), không tin vào đuôi tệp
const HEIC_BRANDS = ["heic", "heix", "heim", "heis", "hevc", "hevx", "mif1", "msf1"];
const isHeic = (buf) =>
  buf.length > 12 && buf.toString("ascii", 4, 8) === "ftyp" && HEIC_BRANDS.includes(buf.toString("ascii", 8, 12));

// sharp bản cài sẵn chỉ giải mã được AVIF, không giải mã được HEIC (nén HEVC) của iPhone -> đổi sang JPEG trước.
// AVIF cũng có thể mang brand "mif1" nên phân biệt bằng kiểu nén (sharp vẫn đọc được metadata của HEIC).
async function toSharpInput(buffer) {
  if (!isHeic(buffer)) return buffer;
  const meta = await sharp(buffer).metadata().catch(() => null);
  if (meta?.compression === "av1") return buffer;
  return Buffer.from(await heicConvert({ buffer, format: "JPEG", quality: 0.92 }));
}

// Trả về ảnh WebP tối đa 1600px, thường chỉ vài trăm KB
export async function processImage(buffer) {
  try {
    const input = await toSharpInput(buffer);
    const meta = await sharp(input, { limitInputPixels: PIXEL_LIMIT }).metadata();
    if (!ALLOWED_FORMATS.includes(meta.format)) throw new Error("format");

    const { data, info } = await sharp(input, { limitInputPixels: PIXEL_LIMIT })
      .rotate() // xoay đúng chiều theo thông tin chụp
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer({ resolveWithObject: true });
    return { data, size: info.size };
  } catch {
    throw httpError(400, "Tệp tải lên không phải ảnh hợp lệ");
  }
}
