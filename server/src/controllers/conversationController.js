import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Connection from "../models/Connection.js";
import Profile from "../models/Profile.js";
import { CHAT_DIR } from "../config/paths.js";
import { httpError, asyncHandler } from "../utils/httpError.js";

const IMAGE_PREVIEW_TEXT = "📷 Đã gửi ảnh";
const FILE_RE = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;

async function loadMine(id, me) {
  if (!mongoose.isValidObjectId(id)) throw httpError(404, "Không tìm thấy cuộc trò chuyện");
  const conv = await Conversation.findOne({ _id: id, participants: me._id });
  if (!conv) throw httpError(404, "Không tìm thấy cuộc trò chuyện");
  return conv;
}

const canChat = async (conv) => {
  if (!conv.connectionId) return false;
  const conn = await Connection.findById(conv.connectionId).select("status").lean();
  return conn?.status === "accepted";
};

// Đường dẫn ảnh trả về cho client: đi qua API có kiểm tra quyền, không lộ tên file ngoài ngữ cảnh
const toMessageDto = (m) => ({
  _id: m._id,
  conversationId: m.conversationId,
  senderId: m.senderId,
  text: m.text || "",
  images: (m.images || []).map((f) => `/api/conversations/${m.conversationId}/images/${f}`),
  createdAt: m.createdAt,
});

export const listConversations = asyncHandler(async (req, res) => {
  const me = req.user._id;
  const convs = await Conversation.find({ participants: me }).sort({ updatedAt: -1 }).lean();

  const connIds = convs.map((c) => c.connectionId).filter(Boolean);
  const conns = await Connection.find({ _id: { $in: connIds } }).select("status").lean();
  const statusById = new Map(conns.map((c) => [String(c._id), c.status]));

  const otherIds = convs.map((c) => c.participants.find((p) => String(p) !== String(me)));
  const profiles = await Profile.find({ userId: { $in: otherIds } }).lean();
  const byUser = new Map(profiles.map((p) => [String(p.userId), p]));

  const unread = await Message.aggregate([
    {
      $match: {
        conversationId: { $in: convs.map((c) => c._id) },
        senderId: { $ne: me },
        readBy: { $ne: me },
      },
    },
    { $group: { _id: "$conversationId", n: { $sum: 1 } } },
  ]);
  const unreadBy = new Map(unread.map((u) => [String(u._id), u.n]));

  const items = convs
    .map((c, i) => {
      const status = statusById.get(String(c.connectionId));
      const p = byUser.get(String(otherIds[i]));
      return {
        id: c._id,
        other: {
          userId: otherIds[i],
          displayName: p?.displayName || "Người dùng",
          avatarUrl: p?.avatarUrl || null,
        },
        lastMessage: c.lastMessage?.text ? c.lastMessage : null,
        unread: unreadBy.get(String(c._id)) || 0,
        canSend: status === "accepted",
        updatedAt: c.updatedAt,
        _status: status,
      };
    })
    // Ẩn cuộc trò chuyện đã bị chặn, và cuộc chưa có tin nhắn mà không còn kết nối
    .filter((c) => c._status !== "blocked" && (c.canSend || c.lastMessage))
    .map(({ _status, ...rest }) => rest);

  res.json({ items });
});

export const getMessages = asyncHandler(async (req, res) => {
  const me = req.user._id;
  const conv = await loadMine(req.params.id, req.user);

  const since = req.query.since ? new Date(req.query.since) : null;
  let messages;
  if (since && !Number.isNaN(since.getTime())) {
    // Polling: chỉ lấy tin mới hơn mốc thời gian client đang có
    messages = await Message.find({ conversationId: conv._id, createdAt: { $gt: since } })
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();
  } else {
    messages = (await Message.find({ conversationId: conv._id }).sort({ createdAt: -1 }).limit(50).lean()).reverse();
  }

  // Đánh dấu đã đọc những tin của người kia
  await Message.updateMany(
    { conversationId: conv._id, senderId: { $ne: me }, readBy: { $ne: me } },
    { $addToSet: { readBy: me } }
  );

  res.json({ messages: messages.map(toMessageDto), canSend: await canChat(conv) });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const me = req.user._id;
  const conv = await loadMine(req.params.id, req.user);

  const text = typeof req.body.text === "string" ? req.body.text.trim() : "";
  const files = req.files || [];
  if (!text && files.length === 0) throw httpError(400, "Tin nhắn không được để trống");

  if (!(await canChat(conv))) {
    throw httpError(403, "Hai bạn chưa kết nối hoặc kết nối đã bị hủy nên không thể nhắn tin");
  }

  const message = await Message.create({
    conversationId: conv._id,
    senderId: me,
    text,
    images: files.map((f) => f.filename),
    readBy: [me],
  });

  conv.lastMessage = { senderId: me, text: (text || IMAGE_PREVIEW_TEXT).slice(0, 200), sentAt: message.createdAt };
  await conv.save();

  res.status(201).json({ message: toMessageDto(message.toObject()) });
});

// Chỉ hai người trong cuộc trò chuyện mới xem được ảnh, và ảnh phải thật sự thuộc cuộc trò chuyện đó
export const getMessageImage = asyncHandler(async (req, res, next) => {
  const conv = await loadMine(req.params.id, req.user);
  const { filename } = req.params;

  if (!FILE_RE.test(filename)) throw httpError(404, "Không tìm thấy ảnh");
  if (!(await Message.exists({ conversationId: conv._id, images: filename }))) {
    throw httpError(404, "Không tìm thấy ảnh");
  }

  res.set("Cache-Control", "private, max-age=86400");
  res.sendFile(filename, { root: CHAT_DIR }, (err) => {
    if (err && !res.headersSent) next(httpError(404, "Không tìm thấy ảnh"));
  });
});