import crypto from "node:crypto";
import mongoose from "mongoose";
import Payment from "../models/Payment.js";
import SubscriptionPlan from "../models/SubscriptionPlan.js";
import PassListing from "../models/PassListing.js";
import AccommodationListing from "../models/AccommodationListing.js";
import MatchView from "../models/MatchView.js";
import { getPlanLimits } from "../services/planService.js";
import { countRequestsThisMonth } from "../services/connectionService.js";
import { PLAN_RANK, activatePlan, findActiveSubscription, todayKey } from "../services/billingService.js";
import { httpError, asyncHandler } from "../utils/httpError.js";

const PENDING_TTL_MS = 15 * 60 * 1000;

const toPaymentDto = (p) => ({
  id: p._id,
  planCode: p.planCode,
  amount: p.amount,
  method: p.method,
  status: p.status,
  transactionRef: p.transactionRef,
  paidAt: p.paidAt,
  createdAt: p.createdAt,
});

const toPlanDto = (p) => ({
  code: p.code,
  name: p.name,
  price: p.price,
  billingCycle: p.billingCycle,
  description: p.description,
  limits: p.limits,
});

/* ---------------- Bảng giá (công khai) ---------------- */
export const getPlans = asyncHandler(async (req, res) => {
  const plans = await SubscriptionPlan.find({ isActive: true }).lean();
  plans.sort((a, b) => PLAN_RANK[a.code] - PLAN_RANK[b.code]);
  res.json({ plans: plans.map(toPlanDto), currentPlan: req.user?.currentPlan || null });
});

/* ---------------- Gói và mức sử dụng của tôi ---------------- */
export const myBilling = asyncHandler(async (req, res) => {
  const user = req.user;
  const [limits, sub, passActive, accActive, requestsUsed, viewsToday, payments] = await Promise.all([
    getPlanLimits(user.currentPlan),
    findActiveSubscription(user._id),
    PassListing.countDocuments({ ownerId: user._id, status: "active" }),
    AccommodationListing.countDocuments({ ownerId: user._id, status: "available" }),
    countRequestsThisMonth(user._id),
    MatchView.countDocuments({ userId: user._id, day: todayKey() }),
    Payment.find({ userId: user._id }).sort({ createdAt: -1 }).limit(20).lean(),
  ]);

  res.json({
    plan: user.currentPlan,
    subscription:
      sub && sub.expiresAt
        ? {
            planCode: sub.planCode,
            startedAt: sub.startedAt,
            expiresAt: sub.expiresAt,
            daysLeft: Math.max(0, Math.ceil((sub.expiresAt.getTime() - Date.now()) / 86400000)),
          }
        : null,
    limits,
    usage: {
      connectionRequests: requestsUsed,
      matchViewsToday: viewsToday,
      passListings: passActive,
      accommodationListings: accActive,
    },
    payments: payments.map(toPaymentDto),
  });
});

/* ---------------- Tạo giao dịch ---------------- */
export const checkout = asyncHandler(async (req, res) => {
  const { planCode, method } = req.body; // amount (nếu client gửi) bị bỏ qua hoàn toàn
  const user = req.user;

  const plan = await SubscriptionPlan.findOne({ code: planCode, isActive: true }).lean();
  if (!plan || !(plan.price > 0)) throw httpError(404, "Không tìm thấy gói");

  if (PLAN_RANK[planCode] < PLAN_RANK[user.currentPlan]) {
    throw httpError(
      409,
      "Bạn đang dùng gói cao hơn. Hãy chờ gói hiện tại hết hạn rồi đăng ký gói này.",
      "DOWNGRADE_BLOCKED"
    );
  }

  // Các giao dịch chờ cũ của người này không còn hiệu lực
  await Payment.updateMany({ userId: user._id, status: "pending" }, { $set: { status: "failed" } });

  const payment = await Payment.create({
    userId: user._id,
    planCode,
    amount: plan.price,
    currency: "VND",
    method,
    status: "pending",
    transactionRef: `${method.toUpperCase()}-${Date.now()}-${crypto.randomInt(1000, 10000)}`,
  });

  res.status(201).json({ payment: toPaymentDto(payment), plan: toPlanDto(plan) });
});

/* ---------------- Cổng thanh toán giả lập ---------------- */
// Bản thật: thay endpoint này bằng IPN/webhook của cổng, xác thực chữ ký rồi mới kích hoạt gói.
export const simulatePayment = asyncHandler(async (req, res) => {
  if (process.env.PAYMENT_MODE !== "mock") {
    throw httpError(403, "Cổng thanh toán giả lập đang tắt (đặt PAYMENT_MODE=mock trong .env)");
  }

  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw httpError(404, "Không tìm thấy giao dịch");

  const success = req.body.result === "success";

  // Chuyển trạng thái nguyên tử pending -> success/failed: bấm hai lần cũng chỉ kích hoạt một lần
  const payment = await Payment.findOneAndUpdate(
    { _id: id, userId: req.user._id, status: "pending", createdAt: { $gte: new Date(Date.now() - PENDING_TTL_MS) } },
    { $set: { status: success ? "success" : "failed", paidAt: success ? new Date() : null } },
    { new: true }
  );
  if (!payment) throw httpError(409, "Giao dịch không tồn tại, đã hết hạn hoặc đã được xử lý");

  let subscription = null;
  if (success) {
    const sub = await activatePlan(req.user._id, payment.planCode);
    payment.subscriptionId = sub._id;
    await payment.save();
    subscription = { planCode: sub.planCode, expiresAt: sub.expiresAt };
  }

  res.json({ payment: toPaymentDto(payment), subscription });
});