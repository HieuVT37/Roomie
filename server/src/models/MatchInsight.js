import mongoose from "mongoose";

const { Schema } = mongoose;

// Nhận xét AI cho một cặp (người xem -> hồ sơ được xem), lưu lại để không gọi Gemini lặp lại.
// `fingerprint` đổi khi một trong hai hồ sơ đổi -> tạo nhận xét mới.
const matchInsightSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fingerprint: { type: String, required: true },
    model: String,
    adjustment: { type: Number, min: -10, max: 10, default: 0 },
    summary: String,
    strengths: [String],
    cautions: [String],
    openers: [String],
  },
  { timestamps: true, collection: "matchInsights" }
);

matchInsightSchema.index({ userId: 1, targetId: 1 }, { unique: true });
// Tự xóa sau 30 ngày không cập nhật để database nhẹ
matchInsightSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 3600 });

export default mongoose.model("MatchInsight", matchInsightSchema);
