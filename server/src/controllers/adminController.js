import mongoose from "mongoose";
import User from "../models/User.js";
import Profile from "../models/Profile.js";
import UserSubscription from "../models/UserSubscription.js";
import SubscriptionPlan from "../models/SubscriptionPlan.js";
import AccommodationListing from "../models/AccommodationListing.js";
import PassListing from "../models/PassListing.js";
import Connection from "../models/Connection.js";
import Payment from "../models/Payment.js";
import Report from "../models/Report.js";
import Faq from "../models/Faq.js";
import Favorite from "../models/Favorite.js";
import StoredFile from "../models/StoredFile.js";
import { activatePlan, PLAN_RANK } from "../services/billingService.js";
import { httpError, asyncHandler } from "../utils/httpError.js";
import { str, escapeRegex } from "../utils/query.js";

const LISTING_MODELS = { accommodation: AccommodationListing, pass: PassListing };
const LIMIT_KEYS = [
  "maxConnectionRequestsPerMonth", "maxMatchViewsPerDay", "maxActivePassListings",
  "maxActiveAccommodationListings", "featuredListingsPerMonth", "canPostAccommodation",
];

const paging = (q) => ({
  page: Math.max(1, parseInt(q.page) || 1),
  limit: Math.min(50, Math.max(1, parseInt(q.limit) || 20)),
});
const pagesOf = (total, limit) => Math.max(1, Math.ceil(total / limit));
const checkId = (id, msg = "Mã không hợp lệ") => {
  if (!mongoose.isValidObjectId(id)) throw httpError(404, msg);
};

// Khóa/cấm: ngưng luôn các tin đang hiển thị của người đó
async function restrictUser(userId, status) {
  await User.updateOne({ _id: userId }, { $set: { status } });
  if (status !== "active") {
    await Promise.all([
      AccommodationListing.updateMany({ ownerId: userId, status: "available" }, { $set: { status: "stopped" } }),
      PassListing.updateMany({ ownerId: userId, status: "active" }, { $set: { status: "closed" } }),
    ]);
  }
}

// Chỉ thao tác được trên người dùng thường, không phải chính mình hay admin khác
async function loadTarget(id, admin) {
  checkId(id, "Không tìm thấy người dùng");
  const target = await User.findById(id).select("role status isLandlord currentPlan email").lean();
  if (!target) throw httpError(404, "Không tìm thấy người dùng");
  if (String(target._id) === String(admin._id)) throw httpError(400, "Không thể tự thay đổi tài khoản của bạn");
  if (target.role === "admin") throw httpError(403, "Không thể thay đổi tài khoản quản trị viên");
  return target;
}

async function ownerMap(ids) {
  const unique = [...new Set(ids.map(String))];
  const [users, profiles] = await Promise.all([
    User.find({ _id: { $in: unique } }).select("email").lean(),
    Profile.find({ userId: { $in: unique } }).select("userId displayName").lean(),
  ]);
  const names = new Map(profiles.map((p) => [String(p.userId), p.displayName]));
  return new Map(users.map((u) => [String(u._id), { id: u._id, email: u.email, displayName: names.get(String(u._id)) || "—" }]));
}

const toPlanDto = (p) => ({
  code: p.code, name: p.name, price: p.price, billingCycle: p.billingCycle,
  description: p.description, isActive: p.isActive, limits: p.limits || {},
});

const toFaqDto = (f) => ({
  id: f._id, question: f.question, answer: f.answer, category: f.category,
  order: f.order ?? 0, isPublished: f.isPublished !== false,
});

/* ---------------- Tổng quan ---------------- */
const monthKey = (d) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).format(d).slice(0, 7);

export const stats = asyncHandler(async (req, res) => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const monthAgo = new Date(now.getTime() - 30 * 86400000);
  const since = new Date(now);
  since.setMonth(since.getMonth() - 5, 1);
  since.setHours(0, 0, 0, 0);

  const [
    usersTotal, usersActive, usersNew, landlords, planAgg,
    accTotal, accAvailable, accPending, passActive, passPending,
    connections, openReports, revenueAll, revenue30, monthly,
  ] = await Promise.all([
    User.countDocuments({ role: "user" }),
    User.countDocuments({ role: "user", status: "active" }),
    User.countDocuments({ role: "user", createdAt: { $gte: weekAgo } }),
    User.countDocuments({ role: "user", isLandlord: true }),
    User.aggregate([{ $match: { role: "user" } }, { $group: { _id: "$currentPlan", n: { $sum: 1 } } }]),
    AccommodationListing.countDocuments(),
    AccommodationListing.countDocuments({ status: "available", moderationStatus: "approved" }),
    AccommodationListing.countDocuments({ moderationStatus: "pending" }),
    PassListing.countDocuments({ status: "active", moderationStatus: "approved" }),
    PassListing.countDocuments({ moderationStatus: "pending" }),
    Connection.countDocuments({ status: "accepted" }),
    Report.countDocuments({ status: { $in: ["open", "reviewing"] } }),
    Payment.aggregate([{ $match: { status: "success" } }, { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }]),
    Payment.aggregate([
      { $match: { status: "success", paidAt: { $gte: monthAgo } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Payment.aggregate([
      { $match: { status: "success", paidAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$paidAt", timezone: "Asia/Ho_Chi_Minh" } }, total: { $sum: "$amount" } } },
    ]),
  ]);

  const byPlan = { basic: 0, plus: 0, pro: 0 };
  planAgg.forEach((p) => { byPlan[p._id] = p.n; });

  const revenueByMonth = new Map(monthly.map((m) => [m._id, m.total]));
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i, 1);
    const key = monthKey(d);
    months.push({ month: key, revenue: revenueByMonth.get(key) || 0 });
  }

  res.json({
    users: { total: usersTotal, active: usersActive, newLast7d: usersNew, landlords, byPlan },
    accommodation: { total: accTotal, available: accAvailable, pending: accPending },
    pass: { active: passActive, pending: passPending },
    connectionsAccepted: connections,
    openReports,
    revenue: { total: revenueAll[0]?.total || 0, count: revenueAll[0]?.count || 0, last30d: revenue30[0]?.total || 0, monthly: months },
  });
});

/* ---------------- Người dùng ---------------- */
export const listUsers = asyncHandler(async (req, res) => {
  const q = req.query;
  const filter = {};
  if (["user", "admin"].includes(str(q.role))) filter.role = str(q.role);
  if (["active", "suspended", "banned", "pending"].includes(str(q.status))) filter.status = str(q.status);
  if (["basic", "plus", "pro"].includes(str(q.plan))) filter.currentPlan = str(q.plan);
  if (str(q.landlord) === "true") filter.isLandlord = true;
  if (str(q.landlord) === "false") filter.isLandlord = false;

  const keyword = str(q.q);
  if (keyword) {
    const re = new RegExp(escapeRegex(keyword), "i");
    const matched = await Profile.find({ displayName: re }).select("userId").limit(200).lean();
    filter.$or = [{ email: re }, { _id: { $in: matched.map((p) => p.userId) } }];
  }

  const { page, limit } = paging(q);
  const [rows, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  const profiles = await Profile.find({ userId: { $in: rows.map((u) => u._id) } }).select("userId displayName").lean();
  const names = new Map(profiles.map((p) => [String(p.userId), p.displayName]));

  res.json({
    items: rows.map((u) => ({
      id: u._id, email: u.email, displayName: names.get(String(u._id)) || "—", role: u.role,
      status: u.status, currentPlan: u.currentPlan, isLandlord: Boolean(u.isLandlord),
      emailVerified: Boolean(u.emailVerified), createdAt: u.createdAt, lastLoginAt: u.lastLoginAt,
    })),
    total, page, pages: pagesOf(total, limit),
  });
});

export const updateUser = asyncHandler(async (req, res) => {
  const target = await loadTarget(req.params.id, req.user);
  const { status, isLandlord } = req.body;

  if (isLandlord !== undefined) await User.updateOne({ _id: target._id }, { $set: { isLandlord } });
  if (status !== undefined) await restrictUser(target._id, status);

  const fresh = await User.findById(target._id).select("status isLandlord currentPlan").lean();
  res.json({ user: { id: fresh._id, status: fresh.status, isLandlord: Boolean(fresh.isLandlord), currentPlan: fresh.currentPlan } });
});

export const grantPlan = asyncHandler(async (req, res) => {
  const target = await loadTarget(req.params.id, req.user);
  const { planCode, days } = req.body;

  if (planCode === "basic") {
    await UserSubscription.updateMany(
      { userId: target._id, status: "active", planCode: { $ne: "basic" } },
      { $set: { status: "cancelled" } }
    );
    await User.updateOne({ _id: target._id }, { $set: { currentPlan: "basic" } });
    return res.json({ currentPlan: "basic", expiresAt: null });
  }

  const sub = await activatePlan(target._id, planCode, days || 30);
  res.json({ currentPlan: planCode, expiresAt: sub.expiresAt });
});

/* ---------------- Duyệt tin ---------------- */
export const listListings = asyncHandler(async (req, res) => {
  const kind = str(req.query.kind) === "pass" ? "pass" : "accommodation";
  const Model = LISTING_MODELS[kind];

  const filter = {};
  const moderation = str(req.query.moderation);
  if (["pending", "approved", "rejected"].includes(moderation)) filter.moderationStatus = moderation;
  const keyword = str(req.query.q);
  if (keyword) filter.title = new RegExp(escapeRegex(keyword), "i");

  const { page, limit } = paging(req.query);
  const [rows, total] = await Promise.all([
    Model.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Model.countDocuments(filter),
  ]);
  const owners = await ownerMap(rows.map((r) => r.ownerId));

  res.json({
    items: rows.map((r) => ({
      id: r._id, kind, title: r.title, type: r.type, price: r.price ?? null,
      image: r.images?.[0] || null, status: r.status,
      moderationStatus: r.moderationStatus, moderationNote: r.moderationNote || "",
      createdAt: r.createdAt, owner: owners.get(String(r.ownerId)) || null,
    })),
    total, page, pages: pagesOf(total, limit),
  });
});

export const moderate = asyncHandler(async (req, res) => {
  const Model = LISTING_MODELS[req.params.kind];
  if (!Model) throw httpError(404, "Loại tin không hợp lệ");
  checkId(req.params.id, "Không tìm thấy tin");

  const { status, note } = req.body;
  const listing = await Model.findByIdAndUpdate(
    req.params.id,
    { $set: { moderationStatus: status, moderationNote: status === "rejected" ? note : "" } },
    { new: true }
  ).lean();
  if (!listing) throw httpError(404, "Không tìm thấy tin");

  res.json({ id: listing._id, moderationStatus: listing.moderationStatus, moderationNote: listing.moderationNote });
});

// Xóa hẳn tin (kể cả tin đã duyệt): gỡ luôn yêu thích và ảnh đã tải lên của tin đó
export const deleteListing = asyncHandler(async (req, res) => {
  const Model = LISTING_MODELS[req.params.kind];
  if (!Model) throw httpError(404, "Loại tin không hợp lệ");
  checkId(req.params.id, "Không tìm thấy tin");

  const listing = await Model.findByIdAndDelete(req.params.id).select("images").lean();
  if (!listing) throw httpError(404, "Không tìm thấy tin");

  const fileIds = (listing.images || [])
    .map((url) => /^\/uploads\/([0-9a-f]{24})\.webp$/.exec(url)?.[1])
    .filter(Boolean);
  await Promise.all([
    Favorite.deleteMany({ targetType: req.params.kind, targetId: listing._id }),
    fileIds.length ? StoredFile.deleteMany({ _id: { $in: fileIds }, kind: "public" }) : null,
  ]);

  res.json({ ok: true });
});

/* ---------------- Báo cáo vi phạm ---------------- */
async function describeTargets(reports) {
  const idsOf = (type) => reports.filter((r) => r.targetType === type).map((r) => r.targetId);
  const [profiles, accs, passes] = await Promise.all([
    Profile.find({ userId: { $in: idsOf("user") } }).select("userId displayName").lean(),
    AccommodationListing.find({ _id: { $in: idsOf("accommodation") } }).select("title").lean(),
    PassListing.find({ _id: { $in: idsOf("pass") } }).select("title").lean(),
  ]);
  const map = new Map();
  profiles.forEach((p) => map.set(`user:${p.userId}`, p.displayName));
  accs.forEach((a) => map.set(`accommodation:${a._id}`, a.title));
  passes.forEach((p) => map.set(`pass:${p._id}`, p.title));
  return map;
}

export const listReports = asyncHandler(async (req, res) => {
  const filter = {};
  if (["open", "reviewing", "resolved", "dismissed"].includes(str(req.query.status))) filter.status = str(req.query.status);
  if (["user", "accommodation", "pass", "message"].includes(str(req.query.targetType))) filter.targetType = str(req.query.targetType);

  const { page, limit } = paging(req.query);
  const [rows, total] = await Promise.all([
    Report.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Report.countDocuments(filter),
  ]);

  const [targets, reporters] = await Promise.all([describeTargets(rows), ownerMap(rows.map((r) => r.reporterId))]);

  res.json({
    items: rows.map((r) => {
      const label = targets.get(`${r.targetType}:${r.targetId}`) ?? null;
      return {
        id: r._id, targetType: r.targetType, targetId: r.targetId, reason: r.reason, detail: r.detail,
        status: r.status, resolution: r.resolution, createdAt: r.createdAt, resolvedAt: r.resolvedAt,
        reporter: reporters.get(String(r.reporterId)) || null,
        target: { label, exists: label !== null },
      };
    }),
    total, page, pages: pagesOf(total, limit),
  });
});

export const handleReport = asyncHandler(async (req, res) => {
  checkId(req.params.id, "Không tìm thấy báo cáo");
  const report = await Report.findById(req.params.id);
  if (!report) throw httpError(404, "Không tìm thấy báo cáo");
  if (["resolved", "dismissed"].includes(report.status)) throw httpError(409, "Báo cáo này đã được xử lý xong");

  const { status, resolution, action = "none" } = req.body;
  if (action !== "none" && status !== "resolved") {
    throw httpError(400, "Chỉ áp dụng hành động khi đánh dấu là đã xử lý");
  }

  if (action === "remove_content") {
    const Model = LISTING_MODELS[report.targetType];
    if (!Model) throw httpError(400, "Chỉ gỡ được tin phòng hoặc bài Pass");
    await Model.updateOne(
      { _id: report.targetId },
      { $set: { moderationStatus: "rejected", moderationNote: `Bị gỡ do vi phạm: ${resolution}`.slice(0, 300) } }
    );
  }

  if (action === "suspend_user") {
    let ownerId = null;
    if (report.targetType === "user") {
      ownerId = report.targetId;
    } else if (LISTING_MODELS[report.targetType]) {
      ownerId = (await LISTING_MODELS[report.targetType].findById(report.targetId).select("ownerId").lean())?.ownerId;
    }
    if (!ownerId) throw httpError(404, "Không xác định được người dùng cần khóa");
    const owner = await User.findById(ownerId).select("role").lean();
    if (!owner) throw httpError(404, "Không tìm thấy người dùng cần khóa");
    if (owner.role === "admin") throw httpError(403, "Không thể khóa tài khoản quản trị viên");
    await restrictUser(ownerId, "suspended");
  }

  const closed = ["resolved", "dismissed"].includes(status);
  report.status = status;
  if (resolution !== undefined) report.resolution = resolution;
  report.handledBy = req.user._id;
  report.resolvedAt = closed ? new Date() : null;
  await report.save();

  res.json({ report: { id: report._id, status: report.status, resolution: report.resolution, resolvedAt: report.resolvedAt } });
});

/* ---------------- Gói dịch vụ ---------------- */
export const listPlans = asyncHandler(async (req, res) => {
  const plans = await SubscriptionPlan.find().lean();
  plans.sort((a, b) => PLAN_RANK[a.code] - PLAN_RANK[b.code]);
  res.json({ plans: plans.map(toPlanDto) });
});

export const updatePlan = asyncHandler(async (req, res) => {
  const plan = await SubscriptionPlan.findOne({ code: req.params.code });
  if (!plan) throw httpError(404, "Không tìm thấy gói");

  const { price, description, isActive, limits } = req.body;
  if (plan.code === "basic" && ((price !== undefined && price !== 0) || isActive === false)) {
    throw httpError(400, "Gói Basic phải miễn phí và luôn được bật");
  }

  if (price !== undefined) plan.price = price;
  if (description !== undefined) plan.description = description;
  if (isActive !== undefined) plan.isActive = isActive;
  if (limits) {
    const next = { ...(plan.limits || {}) };
    for (const key of LIMIT_KEYS) if (limits[key] !== undefined) next[key] = limits[key];
    plan.limits = next;
    plan.markModified("limits");
  }
  await plan.save();
  res.json({ plan: toPlanDto(plan) });
});

/* ---------------- FAQ ---------------- */
export const listFaqsAdmin = asyncHandler(async (req, res) => {
  const items = await Faq.find().sort({ category: 1, order: 1 }).lean();
  res.json({ items: items.map(toFaqDto) });
});

export const createFaq = asyncHandler(async (req, res) => {
  const { question, answer, category, order, isPublished } = req.body;
  const faq = await Faq.create({ question, answer, category, order: order ?? 0, isPublished: isPublished ?? true });
  res.status(201).json({ faq: toFaqDto(faq) });
});

export const updateFaq = asyncHandler(async (req, res) => {
  checkId(req.params.id, "Không tìm thấy câu hỏi");
  const { question, answer, category, order, isPublished } = req.body;
  const faq = await Faq.findByIdAndUpdate(
    req.params.id,
    { $set: { question, answer, category, order: order ?? 0, isPublished: isPublished ?? true } },
    { new: true, runValidators: true }
  );
  if (!faq) throw httpError(404, "Không tìm thấy câu hỏi");
  res.json({ faq: toFaqDto(faq) });
});

export const deleteFaq = asyncHandler(async (req, res) => {
  checkId(req.params.id, "Không tìm thấy câu hỏi");
  const faq = await Faq.findByIdAndDelete(req.params.id);
  if (!faq) throw httpError(404, "Không tìm thấy câu hỏi");
  res.json({ ok: true });
});