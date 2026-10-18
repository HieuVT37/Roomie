import mongoose from "mongoose";
import Favorite from "../models/Favorite.js";
import AccommodationListing from "../models/AccommodationListing.js";
import PassListing from "../models/PassListing.js";
import { toDto } from "./accommodationController.js";
import { toPassDto } from "./passController.js";
import { httpError, asyncHandler } from "../utils/httpError.js";

const TYPES = ["accommodation", "pass"];

// Mỗi loại: model, điều kiện "còn hiển thị được", và hàm chuyển dữ liệu
const KINDS = {
  accommodation: {
    Model: AccommodationListing,
    visible: { moderationStatus: "approved", status: { $ne: "stopped" } },
    toDto,
  },
  pass: {
    Model: PassListing,
    visible: { moderationStatus: "approved", status: { $ne: "closed" } },
    toDto: toPassDto,
  },
};

export const listFavorites = asyncHandler(async (req, res) => {
  const type = req.query.type === "pass" ? "pass" : "accommodation";
  const { Model, visible, toDto: mapDto } = KINDS[type];

  const favs = await Favorite.find({ userId: req.user._id, targetType: type }).sort({ createdAt: -1 }).lean();
  const listings = await Model.find({ _id: { $in: favs.map((f) => f.targetId) }, ...visible }).lean();
  const byId = new Map(listings.map((l) => [String(l._id), l]));

  // Giữ đúng thứ tự "lưu gần nhất lên đầu"; bỏ qua bài đã bị xóa/ngưng
  const items = favs
    .map((f) => byId.get(String(f.targetId)))
    .filter(Boolean)
    .map((l) => mapDto(l, { isFavorite: true }));
  res.json({ items });
});

export const addFavorite = asyncHandler(async (req, res) => {
  const { targetType, targetId } = req.body;
  const { Model, visible } = KINDS[targetType];

  if (!(await Model.exists({ _id: targetId, ...visible }))) throw httpError(404, "Không tìm thấy bài đăng");

  try {
    await Favorite.create({ userId: req.user._id, targetType, targetId });
  } catch (err) {
    if (err.code !== 11000) throw err; // đã yêu thích rồi thì coi như thành công
  }
  res.status(201).json({ ok: true });
});

export const removeFavorite = asyncHandler(async (req, res) => {
  const { targetType, targetId } = req.params;
  if (!TYPES.includes(targetType)) throw httpError(400, "Loại mục yêu thích không hợp lệ");
  if (!mongoose.isValidObjectId(targetId)) throw httpError(400, "Mã không hợp lệ");

  await Favorite.deleteOne({ userId: req.user._id, targetType, targetId });
  res.json({ ok: true });
});