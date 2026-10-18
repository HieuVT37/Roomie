import mongoose from "mongoose";

const { Schema } = mongoose;

const paymentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subscriptionId: { type: Schema.Types.ObjectId, ref: "UserSubscription", default: null },
    planCode: { type: String, enum: ["plus", "pro"], required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ["VND"], default: "VND" },
    method: { type: String, enum: ["momo", "vnpay", "zalopay", "bank_transfer", "card"], required: true },
    status: { type: String, enum: ["pending", "success", "failed", "refunded"], default: "pending" },
    transactionRef: { type: String }, // luôn được gán khi tạo; có index unique trong MongoDB
    paidAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "payments" }
);

export default mongoose.model("Payment", paymentSchema);