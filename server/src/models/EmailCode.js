import mongoose from "mongoose";

// Mã OTP gửi qua email (xác thực đăng ký, quên mật khẩu).
// Chỉ lưu bản băm của mã; mỗi email + mục đích chỉ có một mã còn hiệu lực.
const emailCodeSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    purpose: { type: String, enum: ["register", "reset"], required: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 }, // số lần nhập sai
    lastSentAt: { type: Date, required: true }, // chống gửi liên tục
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, collection: "emailCodes" }
);

emailCodeSchema.index({ email: 1, purpose: 1 }, { unique: true });
// MongoDB tự xóa mã sau khi hết hạn
emailCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("EmailCode", emailCodeSchema);
