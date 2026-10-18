import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Connection from "../models/Connection.js";
import Profile from "../models/Profile.js";
import StoredFile from "../models/StoredFile.js";
import { processImage } from "../services/imageService.js";
import { httpError, asyncHandler } from "../utils/httpError.js";

const IMAGE_PREVIEW_TEXT = "📷 Đã gửi ảnh";
const FILE_RE = /^[0-9a-f]{24}\.webp$/;
const MAX_CHAT_FILES_PER_USER = 200;

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

  const stored = [];
  let message;
  try {
    if (files.length) {
      const used = await StoredFile.countDocuments({ ownerId: me, kind: "chat" });
      if (used + files.length > MAX_CHAT_FILES_PER_USER) {
        throw httpError(403, "Bạn đã gửi quá nhiều ảnh, không thể gửi thêm");
      }
      for (const f of files) {
        const { data, size } = await processImage(f.buffer);
        stored.push({
          _id: new mongoose.Types.ObjectId(), kind: "chat", ownerId: me,
          conversationId: conv._id, contentType: "image/webp", size, data,
        });
      }
      await StoredFile.insertMany(stored);
    }
    message = await Message.create({
      conversationId: conv._id,
      senderId: me,
      text,
      images: stored.map((s) => `${s._id}.webp`),
      readBy: [me],
    });
  } catch (err) {
    // Gửi lỗi thì xóa ảnh vừa lưu, không để ảnh mồ côi
    if (stored.length) await StoredFile.deleteMany({ _id: { $in: stored.map((s) => s._id) } }).catch(() => {});
    throw err;
  }

  conv.lastMessage = { senderId: me, text: (text || IMAGE_PREVIEW_TEXT).slice(0, 200), sentAt: message.createdAt };
  await conv.save();

  res.status(201).json({ message: toMessageDto(message.toObject()) });
});

// Chỉ hai người trong cuộc trò chuyện mới xem được ảnh, và ảnh phải thật sự thuộc cuộc trò chuyện đó
// Chỉ hai người trong cuộc trò chuyện mới xem được ảnh, và ảnh phải thuộc đúng cuộc trò chuyện đó
export const getMessageImage = asyncHandler(async (req, res) => {
  const conv = await loadMine(req.params.id, req.user);
  const { filename } = req.params;
  if (!FILE_RE.test(filename)) throw httpError(404, "Không tìm thấy ảnh");

  const file = await StoredFile.findOne({
    _id: filename.slice(0, 24),
    kind: "chat",
    conversationId: conv._id,
  }).select("data contentType");
  if (!file) throw httpError(404, "Không tìm thấy ảnh");

  res.set({
    "Content-Type": file.contentType,
    "Cache-Control": "private, max-age=86400",
    "X-Content-Type-Options": "nosniff",
  });
  res.send(file.data);
});