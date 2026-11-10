import mongoose from "mongoose";

const { Schema } = mongoose;

// Số lượt nhận xét AI đã dùng của một người trong một tháng (giờ Việt Nam), để áp hạn mức theo gói
const aiInsightUsageSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    month: { type: String, required: true }, // "2026-11"
    count: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, collection: "aiInsightUsages" }
);

aiInsightUsageSchema.index({ userId: 1, month: 1 }, { unique: true });
// Bản ghi tháng cũ không còn dùng: tự xóa sau ~2 tháng
aiInsightUsageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 62 * 24 * 3600 });

export default mongoose.model("AiInsightUsage", aiInsightUsageSchema);
