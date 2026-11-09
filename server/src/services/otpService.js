import crypto from "crypto";
import EmailCode from "../models/EmailCode.js";
import { sendMail, otpEmail } from "./mailService.js";
import { httpError } from "../utils/httpError.js";

const TTL_MS = 10 * 60 * 1000; // mã sống 10 phút
const RESEND_MS = 60 * 1000; // tối thiểu 60 giây giữa hai lần gửi
const MAX_ATTEMPTS = 5; // nhập sai 5 lần thì hủy mã

// Băm mã kèm khóa bí mật của server: lộ database cũng không đoán ngược được mã
const hashCode = (email, purpose, code) =>
  crypto.createHmac("sha256", process.env.JWT_SECRET || "roomie").update(`${purpose}:${email}:${code}`).digest("hex");

// Tạo mã mới, lưu bản băm và gửi email. Ném lỗi 429 nếu gửi lại quá sớm.
export async function issueCode(email, purpose) {
  const existing = await EmailCode.findOne({ email, purpose });
  if (existing && Date.now() - existing.lastSentAt.getTime() < RESEND_MS) {
    const wait = Math.ceil((RESEND_MS - (Date.now() - existing.lastSentAt.getTime())) / 1000);
    throw httpError(429, `Vui lòng đợi ${wait} giây trước khi gửi lại mã`, "OTP_COOLDOWN");
  }

  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  const now = new Date();
  await EmailCode.findOneAndUpdate(
    { email, purpose },
    { codeHash: hashCode(email, purpose, code), attempts: 0, lastSentAt: now, expiresAt: new Date(now.getTime() + TTL_MS) },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  try {
    await sendMail({ to: email, ...otpEmail({ code, purpose }) });
  } catch (err) {
    console.error("Gửi email OTP thất bại:", err.message);
    // Cho phép gửi lại ngay khi lần này thất bại
    await EmailCode.updateOne({ email, purpose }, { lastSentAt: new Date(0) });
    throw httpError(502, "Không gửi được email, vui lòng thử lại sau ít phút", "MAIL_FAILED");
  }
}

// Kiểm tra mã; đúng thì xóa mã (chỉ dùng được một lần)
export async function verifyCode(email, purpose, code) {
  const doc = await EmailCode.findOne({ email, purpose });
  if (!doc || doc.expiresAt.getTime() < Date.now()) {
    throw httpError(400, "Mã đã hết hạn hoặc không tồn tại, vui lòng gửi lại mã", "OTP_EXPIRED");
  }
  if (doc.attempts >= MAX_ATTEMPTS) {
    await doc.deleteOne();
    throw httpError(429, "Bạn đã nhập sai quá nhiều lần, vui lòng gửi lại mã mới", "OTP_LOCKED");
  }

  const a = Buffer.from(hashCode(email, purpose, String(code)), "hex");
  const b = Buffer.from(doc.codeHash, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    doc.attempts += 1;
    await doc.save();
    const left = MAX_ATTEMPTS - doc.attempts;
    throw httpError(400, left > 0 ? `Mã không đúng, còn ${left} lần thử` : "Mã không đúng, vui lòng gửi lại mã mới", "OTP_INVALID");
  }

  await doc.deleteOne();
}
