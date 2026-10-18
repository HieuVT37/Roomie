import mongoose from "mongoose";

const { Schema } = mongoose;

const accommodationSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, default: "" },
    address: {
      city: { type: String, required: true, trim: true },
      district: { type: String, required: true, trim: true },
      ward: { type: String, trim: true },
      street: { type: String, trim: true },
    },
    // GeoJSON (chưa dùng ở form, để dành cho bản đồ sau này)
    location: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number], default: undefined },
    },
    price: { type: Number, required: true, min: 0 },
    deposit: { type: Number, min: 0 },
    area: { type: Number, min: 0 },
    roomType: { type: String, enum: ["single", "shared", "studio", "apartment", "house"] },
    maxOccupants: { type: Number, min: 1 },
    amenities: [{ type: String, trim: true }],
    extraCosts: {
      electricity: Number,
      water: Number,
      internet: Number,
      other: String,
    },
    images: [String],
    rentalTerms: { type: String, default: "" },
    contactPhone: { type: String, default: null },
    availableFrom: { type: Date, default: null },
    status: { type: String, enum: ["available", "rented", "stopped"], default: "available" },
    moderationStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    moderationNote: { type: String, default: "" },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "accommodationListings" }
);

export default mongoose.model("AccommodationListing", accommodationSchema);