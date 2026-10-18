import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../src/models/User.js";

const PASSWORD = "Roomie@123";

await mongoose.connect(process.env.MONGO_URI);
const hash = await bcrypt.hash(PASSWORD, 10);
const result = await User.updateMany({}, { $set: { passwordHash: hash } });
console.log(`Đã đặt mật khẩu "${PASSWORD}" cho ${result.modifiedCount} tài khoản`);
await mongoose.disconnect();