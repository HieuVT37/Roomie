import Report from "../models/Report.js";
import User from "../models/User.js";
import AccommodationListing from "../models/AccommodationListing.js";
import PassListing from "../models/PassListing.js";
import { httpError, asyncHandler } from "../utils/httpError.js";

const DAILY_LIMIT = 10;

export const createReport = asyncHandler(async (req, res) => {
  const me = req.user;
  const { targetType, targetId, reason, detail } = req.body;

  const recent = await Report.countDocuments({
    reporterId: me._id,
    createdAt: { $gte: new Date(Date.now() - 86400000) },
  });
  if (recent >= DAILY_LIMIT) {
    throw httpError(429, "Bạn đã gửi quá nhiều báo cáo hôm nay, vui lòng thử lại sau", "RATE_LIMITED");
  }

  // Xác định chủ của đối tượng bị báo cáo
  let ownerId = null;
  if (targetType === "user") {
    ownerId = (await User.findOne({ _id: targetId, role: "user" }).select("_id").lean())?._id;
  } else {
    const Model = targetType === "accommodation" ? AccommodationListing : PassListing;
    ownerId = (await Model.findById(targetId).select("ownerId").lean())?.ownerId;
  }
  if (!ownerId) throw httpError(404, "Không tìm thấy đối tượng cần báo cáo");
  if (String(ownerId) === String(me._id)) throw httpError(400, "Bạn không thể báo cáo chính mình hoặc nội dung của mình");

  const duplicate = await Report.exists({
    reporterId: me._id,
    targetType,
    targetId,
    status: { $in: ["open", "reviewing"] },
  });
  if (duplicate) throw httpError(409, "Bạn đã báo cáo mục này, chúng tôi đang xem xét");

  await Report.create({ reporterId: me._id, targetType, targetId, reason, detail: detail || "" });
  res.status(201).json({ ok: true });
});