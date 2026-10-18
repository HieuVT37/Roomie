import mongoose from "mongoose";

const { Schema } = mongoose;

export const CRITERIA = [
  "budget", "location", "schedule", "cleanliness",
  "lifestyle", "privacy", "sharedSpace", "interests",
];

const scale = { type: Number, min: 1, max: 5 };
const weight = { type: Number, min: 1, max: 5, default: 3 };

const preferencesSchema = new Schema(
  {
    city: { type: String, trim: true },
    locations: [{ type: String, trim: true }],
    budget: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 },
    },
    schedule: {
      sleepTime: String, // "23:00"
      wakeTime: String,  // "07:00"
      pattern: { type: String, enum: ["student", "office", "freelance", "shift"] },
    },
    cleanliness: scale,
    noiseLevel: scale,
    guestFrequency: { type: String, enum: ["never", "rarely", "sometimes", "often"] },
    privacyNeed: scale,
    sharedSpaceUsage: { type: String, enum: ["minimal", "moderate", "open"] },
    smoking: Boolean,
    pets: Boolean,
    interests: [{ type: String, trim: true }],
    requirements: [{ type: String, trim: true }],
    weights: {
      budget: weight, location: weight, schedule: weight, cleanliness: weight,
      lifestyle: weight, privacy: weight, sharedSpace: weight, interests: weight,
    },
    dealBreakers: [{ type: String, enum: CRITERIA }],
  },
  { _id: false }
);

const profileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    displayName: { type: String, required: true, trim: true, maxlength: 60 },
    avatarUrl: { type: String, default: null },
    bio: { type: String, default: "", maxlength: 500 },
    gender: { type: String, enum: ["male", "female", "other", "private"] },
    birthYear: { type: Number, default: null },
    school: { type: String, default: null },
    occupation: { type: String, default: null },
    isLookingForRoommate: { type: Boolean, default: false },
    roomPhotos: [{ type: String }],
    visibility: {
      school: { type: Boolean, default: true },
      occupation: { type: Boolean, default: true },
      budget: { type: Boolean, default: true },
      schedule: { type: Boolean, default: true },
      interests: { type: Boolean, default: true },
      roomPhotos: { type: Boolean, default: true },
    },
    preferences: { type: preferencesSchema },
  },
  { timestamps: true, collection: "profiles" }
);

export default mongoose.model("Profile", profileSchema);