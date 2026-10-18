import User from "../models/User.js";
import UserSubscription from "../models/UserSubscription.js";

export const PLAN_RANK = { basic: 0, plus: 1, pro: 2 };
export const PLAN_DAYS = 30;
const DAY_MS = 86400000;

// Ngày hiện tại theo giờ Việt Nam, dạng "YYYY-MM-DD" (để đếm hạn mức theo ngày)
export const todayKey = () =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());

// Gói trả phí đang còn hiệu lực của người dùng
export const findActiveSubscription = (userId) =>
  UserSubscription.findOne({
    userId,
    status: "active",
    planCode: { $ne: "basic" },
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  }).sort({ startedAt: -1 });

// Gọi mỗi lần xác thực: gói hết hạn thì hạ về Basic, gói lệch với bản ghi thì đồng bộ lại
export async function ensurePlanFresh(user) {
  if (user.role === "admin" || user.currentPlan === "basic") return user;

  const sub = await findActiveSubscription(user._id);
  if (sub) {
    if (user.currentPlan !== sub.planCode) {
      await User.updateOne({ _id: user._id }, { $set: { currentPlan: sub.planCode } });
      user.currentPlan = sub.planCode;
    }
    return user;
  }

  await UserSubscription.updateMany(
    { userId: user._id, status: "active", planCode: { $ne: "basic" }, expiresAt: { $lte: new Date() } },
    { $set: { status: "expired" } }
  );
  await User.updateOne({ _id: user._id }, { $set: { currentPlan: "basic" } });
  user.currentPlan = "basic";
  return user;
}

// Kích hoạt gói sau khi thanh toán thành công: gia hạn nếu cùng gói, ngược lại thay gói mới ngay
export async function activatePlan(userId, planCode, days = PLAN_DAYS) {
  const now = new Date();
  const current = await findActiveSubscription(userId);
  let sub;

  if (current && current.planCode === planCode) {
    const base = current.expiresAt && current.expiresAt > now ? current.expiresAt : now;
    current.expiresAt = new Date(base.getTime() + days * DAY_MS);
    sub = await current.save();
  } else {
    await UserSubscription.updateMany(
      { userId, status: "active", planCode: { $ne: "basic" } },
      { $set: { status: "cancelled" } }
    );
    sub = await UserSubscription.create({
      userId,
      planCode,
      status: "active",
      startedAt: now,
      expiresAt: new Date(now.getTime() + days * DAY_MS),
      autoRenew: false,
    });
  }

  await User.updateOne({ _id: userId }, { $set: { currentPlan: planCode } });
  return sub;
}