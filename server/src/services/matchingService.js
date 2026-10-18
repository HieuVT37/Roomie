// Tính mức độ tương thích giữa hai hồ sơ (thuật toán theo quy tắc + trọng số, chưa dùng AI)

export const CRITERIA = [
  "budget", "location", "schedule", "cleanliness",
  "lifestyle", "privacy", "sharedSpace", "interests",
];

const DEFAULT_WEIGHT = 3;
const DEALBREAKER_THRESHOLD = 0.4; // điểm tiêu chí dưới 40% mà là "bắt buộc" thì coi như không hợp

const clamp01 = (n) => Math.max(0, Math.min(1, n));
const closeness = (a, b, range) => clamp01(1 - Math.abs(a - b) / range);

const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm || "").split(":").map(Number);
  return Number.isFinite(h) ? h * 60 + (m || 0) : null;
};

// Chênh lệch giờ trên vòng tròn 24h (23:00 và 01:00 chỉ lệch 2 giờ)
const circularDiffMinutes = (a, b) => {
  const d = Math.abs(a - b) % 1440;
  return Math.min(d, 1440 - d);
};

const jaccard = (a = [], b = []) => {
  const A = new Set(a.map((x) => String(x).trim().toLowerCase()).filter(Boolean));
  const B = new Set(b.map((x) => String(x).trim().toLowerCase()).filter(Boolean));
  if (A.size === 0 || B.size === 0) return null;
  let inter = 0;
  A.forEach((x) => B.has(x) && inter++);
  return inter / (A.size + B.size - inter);
};

const ORDER = {
  guestFrequency: ["never", "rarely", "sometimes", "often"],
  sharedSpaceUsage: ["minimal", "moderate", "open"],
};
const ordinalCloseness = (key, a, b) => {
  const list = ORDER[key];
  const i = list.indexOf(a);
  const j = list.indexOf(b);
  if (i < 0 || j < 0) return 0.5;
  return closeness(i, j, list.length - 1);
};

/* ---------- điểm từng tiêu chí (0..1) ---------- */

function budgetScore(a, b) {
  if (!a.budget || !b.budget) return 0.5;
  const overlap = Math.min(a.budget.max, b.budget.max) - Math.max(a.budget.min, b.budget.min);
  if (overlap >= 0) {
    const minWidth = Math.max(1, Math.min(a.budget.max - a.budget.min, b.budget.max - b.budget.min));
    return clamp01(0.5 + 0.5 * (overlap / minWidth));
  }
  const gap = -overlap;
  const top = Math.max(a.budget.max, b.budget.max, 1);
  return clamp01(0.5 - (gap / top) * 1.5);
}

function locationScore(a, b) {
  if (a.city && b.city && a.city !== b.city) return 0;
  const A = (a.locations || []).map((x) => x.trim().toLowerCase());
  const B = (b.locations || []).map((x) => x.trim().toLowerCase());
  if (!A.length || !B.length) return 0.5;
  const shared = A.filter((x) => B.includes(x)).length;
  return shared ? clamp01(0.6 + 0.4 * (shared / Math.min(A.length, B.length))) : 0.2;
}

function scheduleScore(a, b) {
  const sa = a.schedule || {};
  const sb = b.schedule || {};
  const parts = [];
  for (const key of ["sleepTime", "wakeTime"]) {
    const x = toMinutes(sa[key]);
    const y = toMinutes(sb[key]);
    if (x !== null && y !== null) parts.push(clamp01(1 - circularDiffMinutes(x, y) / 240)); // lệch 4h = 0
  }
  const time = parts.length ? parts.reduce((s, v) => s + v, 0) / parts.length : 0.5;
  const pattern = sa.pattern && sb.pattern ? (sa.pattern === sb.pattern ? 1 : 0.5) : 0.5;
  return 0.8 * time + 0.2 * pattern;
}

function lifestyleScore(a, b) {
  const noise = closeness(a.noiseLevel ?? 3, b.noiseLevel ?? 3, 4);
  const guest = ordinalCloseness("guestFrequency", a.guestFrequency, b.guestFrequency);
  const smoking = Boolean(a.smoking) === Boolean(b.smoking) ? 1 : 0;
  const pets = Boolean(a.pets) === Boolean(b.pets) ? 1 : 0.4;
  return 0.3 * noise + 0.3 * guest + 0.3 * smoking + 0.1 * pets;
}

const SCORERS = {
  budget: budgetScore,
  location: locationScore,
  schedule: scheduleScore,
  cleanliness: (a, b) => closeness(a.cleanliness ?? 3, b.cleanliness ?? 3, 4),
  lifestyle: lifestyleScore,
  privacy: (a, b) => closeness(a.privacyNeed ?? 3, b.privacyNeed ?? 3, 4),
  sharedSpace: (a, b) => ordinalCloseness("sharedSpaceUsage", a.sharedSpaceUsage, b.sharedSpaceUsage),
  interests: (a, b) => jaccard(a.interests, b.interests) ?? 0.5,
};

/* ---------- tổng hợp ---------- */

const weightedAverage = (scores, weights = {}) => {
  let sum = 0;
  let total = 0;
  for (const key of CRITERIA) {
    const w = Number(weights[key]) || DEFAULT_WEIGHT;
    sum += scores[key] * w;
    total += w;
  }
  return sum / total;
};

// Trả về: { score (0-100), breakdown, failedDealBreakers, compatible }
export function computeMatch(prefsA, prefsB) {
  const scores = {};
  for (const key of CRITERIA) scores[key] = clamp01(SCORERS[key](prefsA, prefsB));

  // Điểm đối xứng: trung bình theo trọng số của cả hai người,
  // để A xem B và B xem A ra cùng một con số.
  const raw = (weightedAverage(scores, prefsA.weights) + weightedAverage(scores, prefsB.weights)) / 2;

  const failed = new Set();
  for (const p of [prefsA, prefsB]) {
    for (const key of p.dealBreakers || []) {
      if (scores[key] !== undefined && scores[key] < DEALBREAKER_THRESHOLD) failed.add(key);
    }
  }

  const breakdown = {};
  for (const key of CRITERIA) breakdown[key] = Math.round(scores[key] * 100);

  return {
    score: Math.round(raw * 100),
    breakdown,
    failedDealBreakers: [...failed],
    compatible: failed.size === 0,
  };
}

// Hồ sơ đủ thông tin để tham gia Matching chưa? Trả về danh sách mục còn thiếu
export function missingForMatching(profile) {
  const p = profile?.preferences;
  const missing = [];
  if (!p) return ["preferences"];
  if (!p.city) missing.push("city");
  if (!p.locations?.length) missing.push("locations");
  if (!p.budget || p.budget.min == null || p.budget.max == null) missing.push("budget");
  if (!p.schedule?.sleepTime || !p.schedule?.wakeTime) missing.push("schedule");
  if (p.cleanliness == null) missing.push("cleanliness");
  return missing;
}