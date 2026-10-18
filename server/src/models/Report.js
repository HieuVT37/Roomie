import mongoose from "mongoose";

const { Schema } = mongoose;

const reportSchema = new Schema(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetType: { type: String, enum: ["user", "accommodation", "pass", "message"], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    reason: {
      type: String,
      enum: ["spam", "scam", "fake_info", "harassment", "inappropriate", "duplicate", "other"],
      required: true,
    },
    detail: { type: String, default: "", maxlength: 1000 },
    status: { type: String, enum: ["open", "reviewing", "resolved", "dismissed"], default: "open" },
    handledBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    resolution: { type: String, default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "reports" }
);

export default mongoose.model("Report", reportSchema);