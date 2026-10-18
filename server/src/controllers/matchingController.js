import mongoose from "mongoose";
import Profile from "../models/Profile.js";
import User from "../models/User.js";
import { computeMatch, missingForMatching } from "../services/matchingService.js";
import { getRelations, relationFor } from "../services/connectionService.js";
import { httpError, asyncHandler } from "../utils/httpError.js";
import MatchView from "../models/MatchView.js";
import { getPlanLimits } from "../services/planService.js";
import { todayKey } from "../services/billingService.js";
import { str } from "../utils/query.js";

const visible = (p, key) => p.visibility?.[key] !== false;

// Chỉ trả ra thông tin người dùng cho phép công khai
export function toPublicProfile(p) {
  const pr = p.preferences || {};
  return {
    userId: p.userId,
    displayName: p.displayName,
    avatarUrl: p.avatarUrl,
    bio: p.bio,
    gender: p.gender,
    age: p.birthYear ? new Date().getFullYear() - p.birthYear : null,
    school: visible(p, "school") ? p.school : null,
    occupation: visible(p, "occupation") ? p.occupation : null,
    city: pr.city,
    locations: pr.locations || [],
    budget: visible(p, "budget") ? pr.budget : null,
    schedule: visible(p, "schedule") ? pr.schedule : null,
    interests: visible(p, "interests") ? pr.interests || [] : [],
    roomPhotos: visible(p, "roomPhotos") ? p.roomPhotos || [] : [],
    lifestyle: {
      cleanliness: pr.cleanliness,
      noiseLevel: pr.noiseLevel,
      guestFrequency: pr.guestFrequency,
      privacyNeed: pr.privacyNeed,
      sharedSpaceUsage: pr.sharedSpaceUsage,
      smoking: pr.smoking,
      pets: pr.pets,
    },
    requirements: pr.requirements || [],
  };
}

export async function getMyMatchingProfile(userId) {
  const me = await Profile.findOne({ userId }).lean();
  if (missingForMatching(me).length) {
    throw httpError(400, "Hãy hoàn thiện hồ sơ Matching trước khi xem gợi ý", "PROFILE_INCOMPLETE");
  }
  if (!me.isLookingForRoommate) {
    throw httpError(400, "Hãy bật chế độ \"Đang tìm bạn cùng phòng\" trong hồ sơ", "NOT_LOOKING");
  }
  return me;
}

export const listMatches = asyncHandler(async (req, res) => {
  const me = await getMyMatchingProfile(req.user._id);

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(30, Math.max(1, parseInt(req.query.limit) || 12));
  const minScore = Number(req.query.minScore) || 0;
  const location = String(req.query.location || "").trim().toLowerCase();
  const gender = req.query.gender || "";
  const q = str(req.query.q).slice(0, 100).normalize("NFC").toLowerCase();
  const includeIncompatible = req.query.includeIncompatible === "true";

  const candidates = await Profile.find({
    userId: { $ne: req.user._id },
    isLookingForRoommate: true,
    "preferences.city": me.preferences.city,
  })
    .limit(500)
    .lean();

  const activeUsers = await User.find({
    _id: { $in: candidates.map((c) => c.userId) },
    status: "active",
    role: "user",
  })
    .select("_id")
    .lean();
  const activeIds = new Set(activeUsers.map((u) => String(u._id)));

  const relations = await getRelations(req.user._id, candidates.map((c) => c.userId));

  const results = [];
  for (const c of candidates) {
    if (!activeIds.has(String(c.userId))) continue;
    if (missingForMatching(c).length) continue;
    if (gender && c.gender !== gender) continue;
    if (location && !c.preferences.locations.some((l) => l.toLowerCase().includes(location))) continue;
    if (q && !(c.bio || "").normalize("NFC").toLowerCase().includes(q)) continue;

    const relation = relationFor(relations, c.userId);
    if (relation.status === "blocked_by_me" || relation.status === "blocked_me") continue;

    const match = computeMatch(me.preferences, c.preferences);
    if (!includeIncompatible && !match.compatible) continue;
    if (match.score < minScore) continue;

    results.push({ ...toPublicProfile(c), match, relation });
  }

  results.sort((a, b) => b.match.score - a.match.score);

  const total = results.length;
  res.json({
    items: results.slice((page - 1) * limit, page * limit),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  });
});

// Mỗi hồ sơ khác nhau mở chi tiết trong ngày tính 1 lượt; mở lại hồ sơ đã xem thì không tính thêm
async function consumeMatchView(user, targetId) {
  const day = todayKey();
  if (await MatchView.exists({ userId: user._id, targetId, day })) return;

  const [used, limits] = await Promise.all([
    MatchView.countDocuments({ userId: user._id, day }),
    getPlanLimits(user.currentPlan),
  ]);
  if (used >= limits.maxMatchViewsPerDay) {
    throw httpError(
      403,
      `Bạn đã xem hết ${limits.maxMatchViewsPerDay} hồ sơ trong hôm nay (gói ${user.currentPlan}). Hãy quay lại vào ngày mai hoặc nâng cấp gói.`,
      "QUOTA_EXCEEDED"
    );
  }
  await MatchView.create({ userId: user._id, targetId, day }).catch((err) => {
    if (err.code !== 11000) throw err; // mở hai tab cùng lúc: bản ghi đã có thì bỏ qua
  });
}

export const getMatchDetail = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.isValidObjectId(userId)) throw httpError(400, "Mã người dùng không hợp lệ");
  if (String(userId) === String(req.user._id)) throw httpError(400, "Đây là hồ sơ của chính bạn");

  const me = await getMyMatchingProfile(req.user._id);

  const [target, user, relations] = await Promise.all([
    Profile.findOne({ userId }).lean(),
    User.findOne({ _id: userId, status: "active", role: "user" }).select("_id").lean(),
    getRelations(req.user._id, [userId]),
  ]);
  const relation = relationFor(relations, userId);

  if (
    !target || !user || relation.status === "blocked_me" ||
    !target.isLookingForRoommate || missingForMatching(target).length
  ) {
    throw httpError(404, "Không tìm thấy hồ sơ");
  }

  await consumeMatchView(req.user, userId);

  res.json({
    profile: toPublicProfile(target),
    match: computeMatch(me.preferences, target.preferences),
    relation,
  });
});