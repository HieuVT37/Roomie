import mongoose from "mongoose";

const { Schema } = mongoose;

const subscriptionPlanSchema = new Schema(
  {
    code: { type: String, enum: ["basic", "plus", "pro"], required: true, unique: true },
    name: String,
    price: Number,
    billingCycle: String,
    description: String,
    features: [String],
    limits: { type: Schema.Types.Mixed },
    isActive: { type: Boolean, default: true },
  },
  { collection: "subscriptionPlans" }
);

export default mongoose.model("SubscriptionPlan", subscriptionPlanSchema);