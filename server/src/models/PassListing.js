import mongoose from "mongoose";

const { Schema } = mongoose;

const passSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["room", "item"], required: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, default: "" },
    price: { type: Number, min: 0, default: null }, // 0 = cho tặng, null = thỏa thuận
    images: [String],
    area: { type: String, default: "" }, // khu vực giao nhận / vị trí
    contact: { type: String, default: null },

    // Chỉ dùng khi type = "room"
    roomInfo: {
      address: String,
      deposit: Number,
      remainingLeaseMonths: Number,
      availableFrom: Date,
      landlordAgreed: Boolean,
      transferTerms: String,
    },

    // Chỉ dùng khi type = "item"
    itemInfo: {
      category: { type: String, enum: ["furniture", "appliance", "kitchen", "storage", "other"] },
      condition: { type: String, enum: ["new", "like_new", "good", "fair", "old"] },
      dealType: { type: String, enum: ["sell", "give_away", "exchange"] },
    },

    status: { type: String, enum: ["active", "completed", "closed"], default: "active" },
    moderationStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    moderationNote: { type: String, default: "" },
  },
  { timestamps: true, collection: "passListings" }
);

export default mongoose.model("PassListing", passSchema);