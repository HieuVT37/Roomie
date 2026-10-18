import mongoose from "mongoose";

const { Schema } = mongoose;

const connectionSchema = new Schema(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "blocked", "cancelled"],
      required: true,
      default: "pending",
    },
    matchScore: { type: Number, min: 0, max: 100, default: null },
    message: { type: String, maxlength: 300, default: null },
    blockedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    requestedAt: { type: Date, default: Date.now }, // lần gần nhất gửi yêu cầu (để đếm hạn mức tháng)
    respondedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "connections" }
);

export default mongoose.model("Connection", connectionSchema);