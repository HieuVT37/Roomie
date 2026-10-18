import SubscriptionPlan from "../models/SubscriptionPlan.js";

// Giá trị dự phòng nếu database chưa có gói
const FALLBACK = {
  basic: {
    maxConnectionRequestsPerMonth: 5, maxActivePassListings: 3, maxMatchViewsPerDay: 10,
    canPostAccommodation: false, maxActiveAccommodationListings: 0,
  },
  plus: {
    maxConnectionRequestsPerMonth: 30, maxActivePassListings: 10, maxMatchViewsPerDay: 50,
    canPostAccommodation: true, maxActiveAccommodationListings: 3,
  },
  pro: {
    maxConnectionRequestsPerMonth: 200, maxActivePassListings: 30, maxMatchViewsPerDay: 500,
    canPostAccommodation: true, maxActiveAccommodationListings: 20,
  },
};

export async function getPlanLimits(planCode) {
  const plan = await SubscriptionPlan.findOne({ code: planCode, isActive: true }).lean();
  return plan?.limits || FALLBACK[planCode] || FALLBACK.basic;
}