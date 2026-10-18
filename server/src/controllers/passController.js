import mongoose from "mongoose";
import PassListing from "../models/PassListing.js";
import Favorite from "../models/Favorite.js";
import Profile from "../models/Profile.js";
import { getPlanLimits } from "../services/planService.js";
import { httpError, asyncHandler } from "../utils/httpError.js";
import { str, num, escapeRegex } from "../utils/query.js";

const PUBLIC = { status: "active", moderationStatus: "approved" };
const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
};
const ROOM_FIELDS = ["address", "deposit", "remainingLeaseMonths", "availableFrom", "landlordAgreed", "transferTerms"];
const ITEM_FIELDS = ["category", "condition", "dealType"];

const pick = (obj = {}, keys) => Object.fromEntries(keys.map((k) => [k, obj[k]]));

// Thông tin liên hệ không nằm trong DTO, chỉ trả riêng ở trang chi tiết cho người đã đăng nhập
export const toPassDto = (l, extra = {}) => ({
  id: l._id,
  ownerId: l.ownerId,
  type: l.type,
  title: l.title,
  description: l.description,
  price: l.price ?? null,
  images: l.images || [],
  area: l.area || "",
  roomInfo: l.type === "room" ? l.roomInfo || {} : undefined,
  itemInfo: l.type === "item" ? l.itemInfo || {} : undefined,
  status: l.status,
  moderationStatus: l.moderationStatus,
  createdAt: l.createdAt,
  ...extra,
});

async function favoriteSet(user, ids) {
  if (!user || !ids.length) return new Set();
  const favs = await Favorite.find({ userId: user._id, targetType: "pass", targetId: { $in: ids } }).lean();
  return new Set(favs.map((f) => String(f.targetId)));
}

const countActive = (ownerId) => PassListing.countDocuments({ ownerId, status: "active" });

// Hạn mức số bài đang hoạt động theo gói (kiểm tra ở backend, không tin giao diện)
async function assertQuota(user) {
  const [limits, active] = await Promise.all([getPlanLimits(user.currentPlan), countActive(user._id)]);
  if (active >= limits.maxActivePassListings) {
    throw httpError(
      403,
      `Bạn đã đạt giới hạn ${limits.maxActivePassListings} bài Pass đang hoạt động của gói ${user.currentPlan}. Hãy đánh dấu hoàn tất bài cũ hoặc nâng cấp gói.`,
      "QUOTA_EXCEEDED"
    );
  }
}

// Mọi bài mới đều phải chờ admin duyệt mới hiển thị công khai
const initialModeration = () => "pending";

function buildData(body) {
  const data = {
    title: body.title,
    description: body.description ?? "",
    price: body.price ?? null,
    images: body.images || [],
    area: body.area || "",
    contact: body.contact || null,
  };
  if (body.type === "room") {
    data.roomInfo = pick(body.roomInfo, ROOM_FIELDS);
  } else {
    data.itemInfo = pick(body.itemInfo, ITEM_FIELDS);
    if (data.itemInfo.dealType === "give_away") data.price = 0;
  }
  return data;
}

async function loadOwned(id, user) {
  if (!mongoose.isValidObjectId(id)) throw httpError(404, "Không tìm thấy bài đăng");
  const listing = await PassListing.findOne({ _id: id, ownerId: user._id });
  if (!listing) throw httpError(404, "Không tìm thấy bài đăng");
  return listing;
}

/* ---------------- Công khai ---------------- */
export const listPass = asyncHandler(async (req, res) => {
  const q = req.query;
  const filter = { ...PUBLIC };

  if (["room", "item"].includes(str(q.type))) filter.type = str(q.type);
  if (str(q.category)) filter["itemInfo.category"] = str(q.category);
  if (str(q.condition)) filter["itemInfo.condition"] = str(q.condition);
  if (str(q.dealType)) filter["itemInfo.dealType"] = str(q.dealType);

  const minPrice = num(q.minPrice);
  const maxPrice = num(q.maxPrice);
  if (minPrice !== null || maxPrice !== null) {
    filter.price = {};
    if (minPrice !== null) filter.price.$gte = minPrice;
    if (maxPrice !== null) filter.price.$lte = maxPrice;
  }

  if (str(q.area)) filter.area = new RegExp(escapeRegex(str(q.area)), "i");

  const keyword = str(q.q);
  if (keyword) {
    const re = new RegExp(escapeRegex(keyword), "i");
    filter.$or = [{ title: re }, { description: re }, { area: re }];
  }

  const page = Math.max(1, parseInt(q.page) || 1);
  const limit = Math.min(30, Math.max(1, parseInt(q.limit) || 12));
  const sort = { ...(SORTS[str(q.sort)] || SORTS.newest), _id: -1 };

  const [items, total] = await Promise.all([
    PassListing.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    PassListing.countDocuments(filter),
  ]);
  const favs = await favoriteSet(req.user, items.map((i) => i._id));

  res.json({
    items: items.map((l) => toPassDto(l, { isFavorite: favs.has(String(l._id)) })),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  });
});

export const getPass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw httpError(404, "Không tìm thấy bài đăng");

  const l = await PassListing.findById(id).lean();
  const isOwner = Boolean(l && req.user && String(l.ownerId) === String(req.user._id));
  const isAdmin = req.user?.role === "admin";
  const publiclyVisible = l && l.moderationStatus === "approved" && l.status !== "closed";
  if (!l || (!publiclyVisible && !isOwner && !isAdmin)) throw httpError(404, "Không tìm thấy bài đăng");

  const [ownerProfile, favs] = await Promise.all([
    Profile.findOne({ userId: l.ownerId }).select("displayName avatarUrl").lean(),
    favoriteSet(req.user, [l._id]),
  ]);

  res.json({
    listing: toPassDto(l),
    owner: {
      userId: l.ownerId,
      displayName: ownerProfile?.displayName || "Người dùng",
      avatarUrl: ownerProfile?.avatarUrl || null,
    },
    isOwner,
    isFavorite: favs.has(String(l._id)),
    contact: req.user ? l.contact || null : null,
  });
});

/* ---------------- Người đăng ---------------- */
export const myPass = asyncHandler(async (req, res) => {
  const [items, limits, active] = await Promise.all([
    PassListing.find({ ownerId: req.user._id }).sort({ createdAt: -1 }).lean(),
    getPlanLimits(req.user.currentPlan),
    countActive(req.user._id),
  ]);
  res.json({
    items: items.map((l) => toPassDto(l, { moderationNote: l.moderationNote || "" })),
    quota: { active, limit: limits.maxActivePassListings, plan: req.user.currentPlan },
  });
});

export const createPass = asyncHandler(async (req, res) => {
  await assertQuota(req.user);

  const listing = await PassListing.create({
    ...buildData(req.body),
    type: req.body.type,
    ownerId: req.user._id,
    status: "active",
    moderationStatus: initialModeration(),
  });
  res.status(201).json({ listing: toPassDto(listing.toObject()) });
});

export const updatePass = asyncHandler(async (req, res) => {
  const listing = await loadOwned(req.params.id, req.user);
  if (req.body.type !== listing.type) throw httpError(400, "Không thể đổi loại bài đăng");

  // PUT thay thế toàn bộ: trường nào không gửi lên thì bị xóa
  const data = buildData(req.body);
  for (const key of Object.keys(data)) listing.set(key, data[key]);
  listing.moderationStatus = "pending"; // sửa bài thì phải duyệt lại
  listing.moderationNote = "";
  await listing.save();

  res.json({ listing: toPassDto(listing.toObject()) });
});

export const setPassStatus = asyncHandler(async (req, res) => {
  const listing = await loadOwned(req.params.id, req.user);
  const { status } = req.body;

  // Mở lại bài cũ cũng phải qua kiểm tra hạn mức
  if (status === "active" && listing.status !== "active") await assertQuota(req.user);

  listing.status = status;
  await listing.save();
  res.json({ listing: toPassDto(listing.toObject()) });
});

export const removePass = asyncHandler(async (req, res) => {
  const listing = await loadOwned(req.params.id, req.user);
  await Promise.all([
    listing.deleteOne(),
    Favorite.deleteMany({ targetType: "pass", targetId: listing._id }),
  ]);
  res.json({ message: "Đã xóa bài đăng" });
});