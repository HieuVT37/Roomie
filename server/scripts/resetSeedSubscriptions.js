import "dotenv/config";
import mongoose from "mongoose";
import User from "../src/models/User.js";
import UserSubscription from "../src/models/UserSubscription.js";

const SEED = [
  { email: "an.le@example.com", plan: "plus" },
  { email: "chutro.hoang@example.com", plan: "pro" },
];

await mongoose.connect(process.env.MONGO_URI);
const now = new Date();
const oneYear = new Date(now.getTime() + 365 * 86400000);

for (const { email, plan } of SEED) {
  const user = await User.findOne({ email });
  if (!user) {
    console.log("Không thấy tài khoản", email);
    continue;
  }
  await UserSubscription.updateMany(
    { userId: user._id, planCode: { $ne: "basic" }, status: "active" },
    { $set: { status: "cancelled" } }
  );
  await UserSubscription.create({
    userId: user._id, planCode: plan, status: "active", startedAt: now, expiresAt: oneYear, autoRenew: false,
  });
  await User.updateOne({ _id: user._id }, { $set: { currentPlan: plan } });
  console.log(`${email}: gói ${plan}, hết hạn ${oneYear.toLocaleDateString("vi-VN")}`);
}

await mongoose.disconnect();