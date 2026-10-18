import mongoose from "mongoose";
import AccommodationListing from "../models/AccommodationListing.js";
import Favorite from "../models/Favorite.js";
import Profile from "../models/Profile.js";
import { getPlanLimits } from "../services/planService.js";
import { httpError, asyncHandler } from "../utils/httpError.js";

const PUBLIC = { status: "available", moderationStatus: "approved" };
const FIELDS = [
  "title", "description", "address", "price", "deposit", "area", "roomType", "maxOccupants",
  "amenities", "extraCosts", "images", "rentalTerms", "availableFrom", "contactPhone",
];
const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  area_desc: { area: -1 },
};

// Query string có thể là object (?a[$ne]=1) nên luôn ép về chuỗi/số trước khi đưa vào truy vấn Mongo
const str = (v) => (typeof v === "string" ? v.trim() : "");
const num = (v) => {
  if (typeof v !== "string" || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toDto = (l, extra = {}) => ({
  id: l._id,
  ownerId: l.ownerId,
  title: l.title,
  description: l.description,
  address: l.address,
  price: l.price,
  deposit: l.deposit,
  area: l.area,
  roomType: l.roomType,
  maxOccupants: l.maxOccupants,
  amenities: l.amenities || [],
  extraCosts: l.extraCosts || {},
  images: l.images || [],
  rentalTerms: l.rentalTerms,
  availableFrom: l.availableFrom,
  status: l.status,
  moderationStatus: l.moderationStatus,
  viewCount: l.viewCount,
  createdAt: l.createdAt,
  ...extra,
});

async function favoriteSet(user, ids) {
  if (!user || !ids.length) return new Set();
  const favs = await Favorite.find({ userId: user._id, targetType: "accommodation", targetId: { $in: ids } }).lean();
  return new Set(favs.map((f) => String(f.targetId)));
}

const countActive = (ownerId) => AccommodationListing.countDocuments({ ownerId, status: "available" });

// Kiểm tra quyền và hạn mức đăng tin theo gói (làm ở backend, không tin giao diện)
async function assertCanPost(user) {
  if (!user.isLandlord) {
    throw httpError(403, "Tài khoản của bạn chưa được cấp quyền đăng tin cho thuê", "NOT_LANDLORD");
  }
  const limits = await getPlanLimits(user.currentPlan);
  if (!limits.canPostAccommodation) {
    throw httpError(403, "Gói hiện tại không hỗ trợ đăng tin cho thuê, hãy nâng cấp gói", "PLAN_REQUIRED");
  }
  const active = await countActive(user._id);
  if (active >= limits.maxActiveAccommodationListings) {
    throw httpError(
      403,
      `Bạn đã đạt giới hạn ${limits.maxActiveAccommodationListings} tin đang hiển thị của gói ${user.currentPlan}`,
      "QUOTA_EXCEEDED"
    );
  }
}

// Mọi tin mới đều phải chờ admin duyệt mới hiển thị công khai
const initialModeration = () => "pending";

const pick = (obj, keys) => Object.fromEntries(keys.map((k) => [k, obj[k]]));

async function loadOwned(id, user) {
  if (!mongoose.isValidObjectId(id)) throw httpError(404, "Không tìm thấy tin");
  const listing = await AccommodationListing.findOne({ _id: id, ownerId: user._id });
  if (!listing) throw httpError(404, "Không tìm thấy tin");
  return listing;
}

/* ---------------- Công khai ---------------- */
export const getMeta = asyncHandler(async (req, res) => {
  const districts = await AccommodationListing.distinct("address.district", PUBLIC);
  res.json({ districts: districts.sort((a, b) => a.localeCompare(b, "vi")) });
});

export const listAccommodations = asyncHandler(async (req, res) => {
  const q = req.query;
  const filter = { ...PUBLIC };

  if (str(q.city)) filter["address.city"] = str(q.city);
  if (str(q.district)) filter["address.district"] = str(q.district);
  if (str(q.roomType)) filter.roomType = str(q.roomType);

  const minPrice = num(q.minPrice);
  const maxPrice = num(q.maxPrice);
  if (minPrice !== null || maxPrice !== null) {
    filter.price = {};
    if (minPrice !== null) filter.price.$gte = minPrice;
    if (maxPrice !== null) filter.price.$lte = maxPrice;
  }
  const minArea = num(q.minArea);
  if (minArea !== null) filter.area = { $gte: minArea };

  const amenities = str(q.amenities).split(",").map((s) => s.trim()).filter(Boolean);
  if (amenities.length) filter.amenities = { $all: amenities };

  const keyword = str(q.q);
  if (keyword) {
    const re = new RegExp(escapeRegex(keyword), "i");
    filter.$or = [{ title: re }, { "address.street": re }, { "address.ward": re }, { "address.district": re }];
  }

  const page = Math.max(1, parseInt(q.page) || 1);
  const limit = Math.min(30, Math.max(1, parseInt(q.limit) || 12));
  const sort = { ...(SORTS[str(q.sort)] || SORTS.newest), _id: -1 };

  const [items, total] = await Promise.all([
    AccommodationListing.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    AccommodationListing.countDocuments(filter),
  ]);
  const favs = await favoriteSet(req.user, items.map((i) => i._id));

  res.json({
    items: items.map((l) => toDto(l, { isFavorite: favs.has(String(l._id)) })),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  });
});

export const getAccommodation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw httpError(404, "Không tìm thấy tin");

  const l = await AccommodationListing.findById(id).lean();
  const isOwner = Boolean(l && req.user && String(l.ownerId) === String(req.user._id));
  const isAdmin = req.user?.role === "admin";
  const publiclyVisible = l && l.moderationStatus === "approved" && l.status !== "stopped";
  if (!l || (!publiclyVisible && !isOwner && !isAdmin)) throw httpError(404, "Không tìm thấy tin");

  if (!isOwner && !isAdmin) AccommodationListing.updateOne({ _id: id }, { $inc: { viewCount: 1 } }).catch(() => {});

  const [ownerProfile, favs] = await Promise.all([
    Profile.findOne({ userId: l.ownerId }).select("displayName avatarUrl").lean(),
    favoriteSet(req.user, [l._id]),
  ]);

  res.json({
    listing: toDto(l),
    owner: {
      userId: l.ownerId,
      displayName: ownerProfile?.displayName || "Chủ trọ",
      avatarUrl: ownerProfile?.avatarUrl || null,
    },
    isOwner,
    isFavorite: favs.has(String(l._id)),
    // Chỉ người đã đăng nhập mới thấy thông tin liên hệ
    contactPhone: req.user ? l.contactPhone || null : null,
  });
});

/* ---------------- Chủ trọ ---------------- */
export const myAccommodations = asyncHandler(async (req, res) => {
  const [items, limits, active] = await Promise.all([
    AccommodationListing.find({ ownerId: req.user._id }).sort({ createdAt: -1 }).lean(),
    getPlanLimits(req.user.currentPlan),
    countActive(req.user._id),
  ]);
  res.json({
      items: items.map((l) => toDto(l, { moderationNote: l.moderationNote || "" })),
    quota: {
      active,
      limit: limits.maxActiveAccommodationListings,
      canPost: Boolean(req.user.isLandlord && limits.canPostAccommodation),
      plan: req.user.currentPlan,
    },
  });
});

export const createAccommodation = asyncHandler(async (req, res) => {
  await assertCanPost(req.user);

  const listing = await AccommodationListing.create({
    ...pick(req.body, FIELDS),
    ownerId: req.user._id,
    status: "available",
    moderationStatus: initialModeration(),
  });
  res.status(201).json({ listing: toDto(listing.toObject()) });
});

export const updateAccommodation = asyncHandler(async (req, res) => {
  const listing = await loadOwned(req.params.id, req.user);

  // PUT thay thế toàn bộ: trường nào không gửi lên thì bị xóa (ví dụ bỏ trống tiền cọc)
  for (const key of FIELDS) listing.set(key, req.body[key]);
  listing.moderationStatus = "pending"; // sửa tin thì phải duyệt lại
  listing.moderationNote = "";
  await listing.save();

  res.json({ listing: toDto(listing.toObject()) });
});

export const setStatus = asyncHandler(async (req, res) => {
  const listing = await loadOwned(req.params.id, req.user);
  const { status } = req.body;

  if (status === "available" && listing.status !== "available") await assertCanPost(req.user);

  listing.status = status;
  await listing.save();
  res.json({ listing: toDto(listing.toObject()) });
});

export const removeAccommodation = asyncHandler(async (req, res) => {
  const listing = await loadOwned(req.params.id, req.user);
  await Promise.all([
    listing.deleteOne(),
    Favorite.deleteMany({ targetType: "accommodation", targetId: listing._id }),
  ]);
  res.json({ message: "Đã xóa tin" });
});

export { toDto };