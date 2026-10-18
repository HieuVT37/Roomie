import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    status: {
      type: String,
      enum: ["active", "suspended", "banned", "pending"],
      default: "active",
    },
    currentPlan: { type: String, enum: ["basic", "plus", "pro"], default: "basic" },
    isLandlord: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    settings: {
      theme: { type: String, enum: ["light", "dark"], default: "light" },
      language: { type: String, enum: ["vi", "en"], default: "vi" },
      notifications: {
        connection: { type: Boolean, default: true },
        message: { type: Boolean, default: true },
        listing: { type: Boolean, default: true },
      },
    },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "users" }
);

export default mongoose.model("User", userSchema);