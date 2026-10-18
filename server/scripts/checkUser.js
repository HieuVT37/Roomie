import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const [, , email, password] = process.argv;
await mongoose.connect(process.env.MONGO_URI);
console.log("Database đang dùng:", mongoose.connection.name);

const u = await mongoose.connection.db.collection("users").findOne({ email: email.toLowerCase() });
if (!u) {
  console.log("Không thấy tài khoản trong database này");
} else {
  console.log("Các trường của user:", Object.keys(u).join(", "));
  for (const k of ["passwordHash", "password"]) {
    if (typeof u[k] === "string") console.log(`So khớp với ${k}:`, await bcrypt.compare(password, u[k]));
  }
}
await mongoose.disconnect();