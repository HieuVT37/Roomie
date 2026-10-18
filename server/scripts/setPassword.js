import "dotenv/config";
import crypto from "node:crypto";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../src/models/User.js";
import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1", "0.0.0.0"]);

const [, , first, second] = process.argv;

if (!first) {
  console.log("Đổi mật khẩu:   node scripts/setPassword.js <email> '<mật khẩu mới>'");
  console.log("Khóa tài khoản mẫu: node scripts/setPassword.js --lock-others <email giữ lại>");
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);

if (first === "--lock-others") {
  const keep = String(second || "").toLowerCase();
  if (!keep) {
    console.log("Thiếu email cần giữ lại (thường là email admin)");
    process.exit(1);
  }
  const users = await User.find({ email: { $ne: keep } }).select("_id").lean();
  for (const u of users) {
    const hash = await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10); // mật khẩu ngẫu nhiên, không ai biết
    await User.updateOne({ _id: u._id }, { $set: { passwordHash: hash } });
  }
  console.log(`Đã khóa đăng nhập (mật khẩu ngẫu nhiên) cho ${users.length} tài khoản`);
} else {
  const email = first.toLowerCase();
  const password = second || "";
  if (password.length < 10) {
    console.log("Mật khẩu phải có ít nhất 10 ký tự");
    process.exit(1);
  }
  const result = await User.updateOne({ email }, { $set: { passwordHash: await bcrypt.hash(password, 10) } });
  console.log(result.matchedCount ? `Đã đổi mật khẩu cho ${email}` : `Không thấy tài khoản ${email}`);
}

await mongoose.disconnect();