import mongoose from "mongoose";

const { Schema } = mongoose;

// Mỗi dòng = một hồ sơ mà người dùng đã mở chi tiết trong một ngày
const matchViewSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    day: { type: String, required: true }, // "2026-10-17"
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "matchViews" }
);

matchViewSchema.index({ userId: 1, day: 1, targetId: 1 }, { unique: true });

export default mongoose.model("MatchView", matchViewSchema);