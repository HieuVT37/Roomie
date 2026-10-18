import Connection from "../models/Connection.js";
import Conversation from "../models/Conversation.js";

export const startOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

// Tìm bản ghi kết nối giữa 2 người (không phân biệt ai gửi)
export const findPair = (a, b) =>
  Connection.findOne({
    $or: [
      { requesterId: a, receiverId: b },
      { requesterId: b, receiverId: a },
    ],
  });

// Số yêu cầu đã gửi trong tháng này (không tính bản ghi chặn)
export function countRequestsThisMonth(userId) {
  const start = startOfMonth();
  return Connection.countDocuments({
    requesterId: userId,
    status: { $ne: "blocked" },
    $or: [
      { requestedAt: { $gte: start } },
      { requestedAt: { $exists: false }, createdAt: { $gte: start } },
    ],
  });
}

// Quan hệ nhìn từ phía "tôi": none | sent | received | accepted | blocked_by_me | blocked_me
export function relationOf(conn, myId) {
  if (!conn) return { status: "none", connectionId: null };
  const iRequested = String(conn.requesterId) === String(myId);
  switch (conn.status) {
    case "pending":
      return { status: iRequested ? "sent" : "received", connectionId: conn._id };
    case "accepted":
      return { status: "accepted", connectionId: conn._id };
    case "blocked": {
      const blocker = String(conn.blockedBy || conn.requesterId);
      return { status: blocker === String(myId) ? "blocked_by_me" : "blocked_me", connectionId: conn._id };
    }
    default: // rejected, cancelled
      return { status: "none", connectionId: conn._id };
  }
}

export async function getRelations(myId, otherIds) {
  const map = new Map();
  if (!otherIds.length) return map;
  const conns = await Connection.find({
    $or: [
      { requesterId: myId, receiverId: { $in: otherIds } },
      { receiverId: myId, requesterId: { $in: otherIds } },
    ],
  }).lean();
  for (const c of conns) {
    const other = String(c.requesterId) === String(myId) ? c.receiverId : c.requesterId;
    map.set(String(other), relationOf(c, myId));
  }
  return map;
}

export const relationFor = (map, userId) =>
  map.get(String(userId)) || { status: "none", connectionId: null };

// Mỗi kết nối được chấp nhận có đúng một cuộc trò chuyện
export async function ensureConversation(conn) {
  let conv = await Conversation.findOne({ connectionId: conn._id });
  if (!conv) {
    conv = await Conversation.findOne({ participants: { $all: [conn.requesterId, conn.receiverId] } });
    if (conv) {
      conv.connectionId = conn._id;
      await conv.save();
    }
  }
  if (!conv) {
    conv = await Conversation.create({
      participants: [conn.requesterId, conn.receiverId],
      connectionId: conn._id,
    });
  }
  return conv;
}