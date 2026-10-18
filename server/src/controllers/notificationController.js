import { asyncHandler } from "../utils/httpError.js";
import { countUnreadMessages } from "./conversationController.js";
import { unseenCounts } from "./connectionController.js";

// Một request nhẹ cho chấm đỏ trên thanh menu (Kết nối, Tin nhắn)
export const notificationSummary = asyncHandler(async (req, res) => {
  const me = req.user._id;
  const [messages, connections] = await Promise.all([countUnreadMessages(me), unseenCounts(me)]);
  res.json({ messages, connections: connections.total });
});
