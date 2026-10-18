import Profile from "../models/Profile.js";
import { missingForMatching } from "../services/matchingService.js";
import { httpError, asyncHandler } from "../utils/httpError.js";

const TOP_FIELDS = [
  "displayName", "avatarUrl", "bio", "gender", "birthYear", "school",
  "occupation", "isLookingForRoommate", "roomPhotos", "visibility",
];
const PREF_FIELDS = [
  "city", "locations", "budget", "schedule", "cleanliness", "noiseLevel",
  "guestFrequency", "privacyNeed", "sharedSpaceUsage", "smoking", "pets",
  "interests", "requirements", "weights", "dealBreakers",
];
const MISSING_LABELS = {
  preferences: "tiêu chí sống chung",
  city: "thành phố",
  locations: "khu vực mong muốn",
  budget: "ngân sách",
  schedule: "giờ ngủ và giờ thức",
  cleanliness: "mức độ sạch sẽ",
};

const pick = (obj, keys) =>
  Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));

export const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ userId: req.user._id });
  if (!profile) throw httpError(404, "Chưa có hồ sơ");
  res.json({ profile, missing: missingForMatching(profile) });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const current = await Profile.findOne({ userId: req.user._id });
  if (!current) throw httpError(404, "Chưa có hồ sơ");

  const update = pick(req.body, TOP_FIELDS);
  if (req.body.preferences) update.preferences = pick(req.body.preferences, PREF_FIELDS);

  // Muốn bật "đang tìm bạn cùng phòng" thì phải điền đủ tiêu chí cơ bản
  const willLook = update.isLookingForRoommate ?? current.isLookingForRoommate;
  if (willLook) {
    const missing = missingForMatching({ preferences: update.preferences ?? current.preferences });
    if (missing.length) {
      const names = missing.map((m) => MISSING_LABELS[m] || m).join(", ");
      throw httpError(422, `Cần điền đủ để tham gia Matching: ${names}`, "PROFILE_INCOMPLETE");
    }
  }

  const profile = await Profile.findOneAndUpdate(
    { userId: req.user._id },
    { $set: update },
    { new: true, runValidators: true }
  );
  res.json({ profile, missing: missingForMatching(profile) });
});