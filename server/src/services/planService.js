import SubscriptionPlan from "../models/SubscriptionPlan.js";

// Giá trị dự phòng nếu database chưa có gói, hoặc gói trong database còn thiếu hạn mức mới thêm sau
const FALLBACK = {
  basic: {
    maxConnectionRequestsPerMonth: 5, maxActivePassListings: 3, maxMatchViewsPerDay: 10,
    canPostAccommodation: false, maxActiveAccommodationListings: 0, maxAiInsightsPerMonth: 10,
  },
  plus: {
    maxConnectionRequestsPerMonth: 30, maxActivePassListings: 10, maxMatchViewsPerDay: 50,
    canPostAccommodation: true, maxActiveAccommodationListings: 3, maxAiInsightsPerMonth: 30,
  },
  pro: {
    maxConnectionRequestsPerMonth: 200, maxActivePassListings: 30, maxMatchViewsPerDay: 500,
    canPostAccommodation: true, maxActiveAccommodationListings: 20, maxAiInsightsPerMonth: 100,
  },
};

// Gộp hạn mức trong database với giá trị dự phòng (database ưu tiên)
export const withDefaultLimits = (planCode, limits) => ({ ...(FALLBACK[planCode] || FALLBACK.basic), ...(limits || {}) });

export async function getPlanLimits(planCode) {
  const plan = await SubscriptionPlan.findOne({ code: planCode, isActive: true }).lean();
  return withDefaultLimits(planCode, plan?.limits);
}
