import mongoose from "mongoose";

const { Schema } = mongoose;

const userSubscriptionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    planCode: { type: String, enum: ["basic", "plus", "pro"], required: true },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled", "pending_payment"],
      required: true,
    },
    startedAt: { type: Date, required: true },
    expiresAt: { type: Date, default: null },
    autoRenew: { type: Boolean, default: false },
  },
  { timestamps: false, collection: "userSubscriptions" }
);

export default mongoose.model("UserSubscription", userSubscriptionSchema);