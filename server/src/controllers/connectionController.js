import mongoose from "mongoose";
import Connection from "../models/Connection.js";
import Profile from "../models/Profile.js";
import User from "../models/User.js";
import { computeMatch, missingForMatching } from "../services/matchingService.js";
import { getPlanLimits } from "../services/planService.js";
import { findPair, countRequestsThisMonth, ensureConversation } from "../services/connectionService.js";
import { getMyMatchingProfile } from "./matchingController.js";
import { httpError, asyncHandler } from "../utils/httpError.js";

const REJECT_COOLDOWN_DAYS = 7;

const brief = (p, userId) => ({
  userId: p?.userId || userId,
  displayName: p?.displayName || "Người dùng",
  avatarUrl: p?.avatarUrl || null,
  gender: p?.gender,
  age: p?.birthYear ? new Date().getFullYear() - p.birthYear : null,
  bio: p?.bio || "",
});

const serialize = (c) => ({
  id: c._id,
  status: c.status,
  matchScore: c.matchScore,
  message: c.message,
  requestedAt: c.requestedAt || c.createdAt,
  respondedAt: c.respondedAt,
});

// Mục này có phải thông báo mới đối với "tôi" không
const isUnseenFor = (c, me) =>
  String(c.receiverId) === String(me)
    ? c.status === "pending" && c.unseenByReceiver !== false
    : Boolean(c.unseenByRequester);

const checkId = (id, label = "Mã") => {
  if (!mongoose.isValidObjectId(id)) throw httpError(400, `${label} không hợp lệ`);
};

// Lấy kết nối mà người dùng hiện tại là một trong hai bên
async function loadMine(id, me) {
  if (!mongoose.isValidObjectId(id)) throw httpError(404, "Không tìm thấy kết nối");
  const conn = await Connection.findById(id);
  const mine = conn && [String(conn.requesterId), String(conn.receiverId)].includes(String(me._id));
  if (!mine) throw httpError(404, "Không tìm thấy kết nối");
  return conn;
}

// Số thông báo chưa xem của từng tab
export async function unseenCounts(me) {
  const [received, sentPending, sentRejected, accepted] = await Promise.all([
    Connection.countDocuments({ receiverId: me, status: "pending", unseenByReceiver: { $ne: false } }),
    Connection.countDocuments({ requesterId: me, status: "pending", unseenByRequester: true }),
    Connection.countDocuments({ requesterId: me, status: "rejected", unseenByRequester: true }),
    Connection.countDocuments({ requesterId: me, status: "accepted", unseenByRequester: true }),
  ]);
  const sent = sentPending + sentRejected;
  return { received, sent, accepted, total: received + sent + accepted };
}

/* ---------------- Gửi yêu cầu ---------------- */
export const sendRequest = asyncHandler(async (req, res) => {
  const me = req.user;
  const { receiverId, message } = req.body;

  if (String(receiverId) === String(me._id)) throw httpError(400, "Không thể kết nối với chính mình");

  const myProfile = await getMyMatchingProfile(me._id);

  const [target, targetUser] = await Promise.all([
    Profile.findOne({ userId: receiverId }).lean(),
    User.findOne({ _id: receiverId, status: "active", role: "user" }).select("_id").lean(),
  ]);
  if (!target || !targetUser || !target.isLookingForRoommate || missingForMatching(target).length) {
    throw httpError(404, "Không tìm thấy hồ sơ");
  }

  const existing = await findPair(me._id, receiverId);
  if (existing) {
    const iRequested = String(existing.requesterId) === String(me._id);
    if (existing.status === "blocked") throw httpError(403, "Không thể gửi yêu cầu đến người dùng này");
    if (existing.status === "accepted") throw httpError(409, "Hai bạn đã kết nối với nhau");
    if (existing.status === "pending") {
      throw httpError(
        409,
        iRequested
          ? "Bạn đã gửi yêu cầu, đang chờ phản hồi"
          : "Người này đã gửi yêu cầu cho bạn, hãy vào mục Kết nối để chấp nhận"
      );
    }
    if (existing.status === "rejected" && iRequested && existing.respondedAt) {
      const days = (Date.now() - existing.respondedAt.getTime()) / 86400000;
      if (days < REJECT_COOLDOWN_DAYS) {
        throw httpError(409, "Chưa thể gửi lại yêu cầu lúc này, vui lòng thử lại sau");
      }
    }
  }

  // Hạn mức theo gói dịch vụ (kiểm tra ở backend)
  const [used, limits] = await Promise.all([countRequestsThisMonth(me._id), getPlanLimits(me.currentPlan)]);
  if (used >= limits.maxConnectionRequestsPerMonth) {
    throw httpError(
      403,
      `Bạn đã dùng hết ${limits.maxConnectionRequestsPerMonth} yêu cầu kết nối trong tháng (gói ${me.currentPlan}). Nâng cấp gói để gửi thêm.`,
      "QUOTA_EXCEEDED"
    );
  }

  const payload = {
    requesterId: me._id,
    receiverId,
    status: "pending",
    matchScore: computeMatch(myProfile.preferences, target.preferences).score,
    message: message || null,
    blockedBy: null,
    requestedAt: new Date(),
    respondedAt: null,
    unseenByReceiver: true,
    unseenByRequester: false,
  };

  let conn;
  if (existing) {
    Object.assign(existing, payload);
    conn = await existing.save();
  } else {
    conn = await Connection.create(payload);
  }

  res.status(201).json({ connection: serialize(conn) });
});

/* ---------------- Danh sách + tổng quan ---------------- */
export const listConnections = asyncHandler(async (req, res) => {
  const me = req.user._id;
  const type = req.query.type || "accepted";

  const filters = {
    received: { receiverId: me, status: "pending" },
    // Gồm cả yêu cầu vừa bị từ chối mà người gửi chưa xem, để họ biết được phản hồi
    sent: { requesterId: me, $or: [{ status: "pending" }, { status: "rejected", unseenByRequester: true }] },
    accepted: { $or: [{ requesterId: me }, { receiverId: me }], status: "accepted" },
    blocked: { blockedBy: me, status: "blocked" },
  };
  if (!filters[type]) throw httpError(400, "Loại danh sách không hợp lệ");

  const conns = await Connection.find(filters[type]).sort({ requestedAt: -1, createdAt: -1 }).lean();
  const otherIds = conns.map((c) => (String(c.requesterId) === String(me) ? c.receiverId : c.requesterId));
  const profiles = await Profile.find({ userId: { $in: otherIds } }).lean();
  const byUser = new Map(profiles.map((p) => [String(p.userId), p]));

  const items = conns.map((c, i) => ({
    ...serialize(c),
    unseen: isUnseenFor(c, me),
    user: brief(byUser.get(String(otherIds[i])), otherIds[i]),
  }));
  res.json({ items });
});

export const summary = asyncHandler(async (req, res) => {
  const me = req.user._id;
  const [receivedPending, sentPending, accepted, used, limits] = await Promise.all([
    Connection.countDocuments({ receiverId: me, status: "pending" }),
    Connection.countDocuments({ requesterId: me, status: "pending" }),
    Connection.countDocuments({ $or: [{ requesterId: me }, { receiverId: me }], status: "accepted" }),
    countRequestsThisMonth(me),
    getPlanLimits(req.user.currentPlan),
  ]);
  res.json({
    receivedPending,
    sentPending,
    accepted,
    requestsUsed: used,
    requestsLimit: limits.maxConnectionRequestsPerMonth,
    plan: req.user.currentPlan,
    unseen: await unseenCounts(me),
  });
});

/* ---------------- Phản hồi ---------------- */
export const accept = asyncHandler(async (req, res) => {
  const conn = await loadMine(req.params.id, req.user);
  if (conn.status !== "pending") throw httpError(409, "Yêu cầu này không còn ở trạng thái chờ");
  if (String(conn.receiverId) !== String(req.user._id)) throw httpError(403, "Chỉ người nhận mới được chấp nhận");

  conn.status = "accepted";
  conn.respondedAt = new Date();
  conn.unseenByReceiver = false;
  conn.unseenByRequester = true; // báo cho người gửi biết đã được chấp nhận
  await conn.save();
  const conv = await ensureConversation(conn);
  res.json({ connection: serialize(conn), conversationId: conv._id });
});

export const reject = asyncHandler(async (req, res) => {
  const conn = await loadMine(req.params.id, req.user);
  if (conn.status !== "pending") throw httpError(409, "Yêu cầu này không còn ở trạng thái chờ");
  if (String(conn.receiverId) !== String(req.user._id)) throw httpError(403, "Chỉ người nhận mới được từ chối");

  conn.status = "rejected";
  conn.respondedAt = new Date();
  conn.unseenByReceiver = false;
  conn.unseenByRequester = true; // báo cho người gửi biết bị từ chối
  await conn.save();
  res.json({ connection: serialize(conn) });
});

export const cancel = asyncHandler(async (req, res) => {
  const conn = await loadMine(req.params.id, req.user);
  if (conn.status !== "pending") throw httpError(409, "Yêu cầu này không còn ở trạng thái chờ");
  if (String(conn.requesterId) !== String(req.user._id)) throw httpError(403, "Chỉ người gửi mới được hủy yêu cầu");

  conn.status = "cancelled";
  conn.respondedAt = new Date();
  conn.unseenByReceiver = false;
  await conn.save();
  res.json({ connection: serialize(conn) });
});

// Hủy kết nối đã chấp nhận (một trong hai bên đều được)
export const disconnect = asyncHandler(async (req, res) => {
  const conn = await loadMine(req.params.id, req.user);
  if (conn.status !== "accepted") throw httpError(409, "Hai bạn chưa kết nối");

  conn.status = "cancelled";
  conn.respondedAt = new Date();
  await conn.save();
  res.json({ message: "Đã hủy kết nối" });
});

// Mở tab nào thì xóa chấm đỏ của tab đó
export const markSeen = asyncHandler(async (req, res) => {
  const me = req.user._id;
  const { type } = req.body;
  if (type === "received") {
    await Connection.updateMany(
      { receiverId: me, status: "pending", unseenByReceiver: { $ne: false } },
      { $set: { unseenByReceiver: false } }
    );
  } else if (type === "sent") {
    await Connection.updateMany(
      { requesterId: me, status: { $in: ["pending", "rejected"] }, unseenByRequester: true },
      { $set: { unseenByRequester: false } }
    );
  } else if (type === "accepted") {
    await Connection.updateMany(
      { requesterId: me, status: "accepted", unseenByRequester: true },
      { $set: { unseenByRequester: false } }
    );
  } else {
    throw httpError(400, "Loại danh sách không hợp lệ");
  }
  res.json({ ok: true });
});

/* ---------------- Chặn / bỏ chặn ---------------- */
export const block = asyncHandler(async (req, res) => {
  const me = req.user._id;
  const { userId } = req.params;
  checkId(userId, "Mã người dùng");
  if (String(userId) === String(me)) throw httpError(400, "Không thể tự chặn chính mình");

  const conn = await findPair(me, userId);
  if (conn) {
    // Nếu người kia đã chặn mình thì giữ nguyên, không ghi đè
    if (conn.status === "blocked" && String(conn.blockedBy || conn.requesterId) !== String(me)) {
      return res.json({ message: "Đã chặn người dùng" });
    }
    conn.status = "blocked";
    conn.blockedBy = me;
    await conn.save();
  } else {
    await Connection.create({
      requesterId: me,
      receiverId: userId,
      status: "blocked",
      blockedBy: me,
      matchScore: null,
    });
  }
  res.json({ message: "Đã chặn người dùng" });
});

export const unblock = asyncHandler(async (req, res) => {
  const me = req.user._id;
  const { userId } = req.params;
  checkId(userId, "Mã người dùng");

  const conn = await findPair(me, userId);
  if (!conn || conn.status !== "blocked" || String(conn.blockedBy) !== String(me)) {
    throw httpError(404, "Bạn chưa chặn người dùng này");
  }
  conn.status = "cancelled";
  conn.blockedBy = null;
  await conn.save();
  res.json({ message: "Đã bỏ chặn" });
});