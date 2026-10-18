/* ============================================================
 * ROOMIE - Script khởi tạo MongoDB (mongosh)
 * Chạy:  mongosh "mongodb://localhost:27017" roomie_init.js
 * Cảnh báo: script sẽ XÓA database "roomie" cũ rồi tạo lại.
 * ============================================================ */

const database = db.getSiblingDB("roomie");
database.dropDatabase();

const now = new Date();
const daysAgo = (n) => new Date(now.getTime() - n * 86400000);
const daysLater = (n) => new Date(now.getTime() + n * 86400000);

/* ------------------------------------------------------------
 * 1. TẠO COLLECTION + VALIDATOR
 * ------------------------------------------------------------ */
const opts = (schema) => ({
  validator: { $jsonSchema: schema },
  validationLevel: "moderate",
  validationAction: "error",
});

// 1.1 users: tài khoản đăng nhập (không chứa thông tin matching)
database.createCollection("users", opts({
  bsonType: "object",
  required: ["email", "passwordHash", "role", "status", "currentPlan", "createdAt"],
  properties: {
    email: { bsonType: "string", pattern: "^\\S+@\\S+\\.\\S+$" },
    passwordHash: { bsonType: "string" },
    role: { enum: ["user", "admin"] },
    status: { enum: ["active", "suspended", "banned", "pending"] },
    currentPlan: { enum: ["basic", "plus", "pro"] }, // bản sao để check nhanh, nguồn thật là userSubscriptions
    isLandlord: { bsonType: "bool" },                // quyền đăng tin cho thuê phòng
    emailVerified: { bsonType: "bool" },
    settings: {
      bsonType: "object",
      properties: {
        theme: { enum: ["light", "dark"] },
        language: { enum: ["vi", "en"] },
        notifications: {
          bsonType: "object",
          properties: {
            connection: { bsonType: "bool" },
            message: { bsonType: "bool" },
            listing: { bsonType: "bool" },
          },
        },
      },
    },
    lastLoginAt: { bsonType: ["date", "null"] },
    createdAt: { bsonType: "date" },
    updatedAt: { bsonType: "date" },
  },
}));

// 1.2 profiles: hồ sơ + tiêu chí matching (gộp MatchingPreferences vào đây)
database.createCollection("profiles", opts({
  bsonType: "object",
  required: ["userId", "displayName"],
  properties: {
    userId: { bsonType: "objectId" },
    displayName: { bsonType: "string", minLength: 1, maxLength: 60 },
    avatarUrl: { bsonType: ["string", "null"] },
    bio: { bsonType: "string", maxLength: 500 },
    gender: { enum: ["male", "female", "other", "private"] },
    birthYear: { bsonType: ["int", "null"] },
    school: { bsonType: ["string", "null"] },
    occupation: { bsonType: ["string", "null"] },
    isLookingForRoommate: { bsonType: "bool" },
    // Người dùng chọn trường nào hiển thị công khai
    visibility: {
      bsonType: "object",
      properties: {
        school: { bsonType: "bool" },
        occupation: { bsonType: "bool" },
        budget: { bsonType: "bool" },
        schedule: { bsonType: "bool" },
        interests: { bsonType: "bool" },
      },
    },
    preferences: {
      bsonType: "object",
      properties: {
        city: { bsonType: "string" },
        locations: { bsonType: "array", items: { bsonType: "string" } },
        budget: {
          bsonType: "object",
          required: ["min", "max"],
          properties: { min: { bsonType: "int" }, max: { bsonType: "int" } }, // VND/tháng
        },
        schedule: {
          bsonType: "object",
          properties: {
            sleepTime: { bsonType: "string" }, // "23:00"
            wakeTime: { bsonType: "string" },  // "07:00"
            pattern: { enum: ["student", "office", "freelance", "shift"] },
          },
        },
        cleanliness: { bsonType: "int", minimum: 1, maximum: 5 },
        noiseLevel: { bsonType: "int", minimum: 1, maximum: 5 },
        guestFrequency: { enum: ["never", "rarely", "sometimes", "often"] },
        privacyNeed: { bsonType: "int", minimum: 1, maximum: 5 },
        sharedSpaceUsage: { enum: ["minimal", "moderate", "open"] },
        smoking: { bsonType: "bool" },
        pets: { bsonType: "bool" },
        interests: { bsonType: "array", items: { bsonType: "string" } },
        requirements: { bsonType: "array", items: { bsonType: "string" } },
        // Trọng số 1-5 cho từng nhóm tiêu chí (dùng khi tính % Compatible)
        weights: { bsonType: "object" },
        // Tiêu chí bắt buộc: nếu lệch quá nhiều thì loại luôn
        dealBreakers: {
          bsonType: "array",
          items: { enum: ["budget", "location", "schedule", "cleanliness", "lifestyle", "privacy", "sharedSpace"] },
        },
      },
    },
    createdAt: { bsonType: "date" },
    updatedAt: { bsonType: "date" },
  },
}));

// 1.3 connections: yêu cầu kết nối giữa 2 người
database.createCollection("connections", opts({
  bsonType: "object",
  required: ["requesterId", "receiverId", "status", "createdAt"],
  properties: {
    requesterId: { bsonType: "objectId" },
    receiverId: { bsonType: "objectId" },
    status: { enum: ["pending", "accepted", "rejected", "blocked", "cancelled"] },
    matchScore: { bsonType: ["int", "double", "null"], minimum: 0, maximum: 100 },
    message: { bsonType: ["string", "null"] },
    respondedAt: { bsonType: ["date", "null"] },
    createdAt: { bsonType: "date" },
  },
}));

// 1.4 conversations + messages
database.createCollection("conversations", opts({
  bsonType: "object",
  required: ["participants", "createdAt"],
  properties: {
    participants: { bsonType: "array", minItems: 2, maxItems: 2, items: { bsonType: "objectId" } },
    connectionId: { bsonType: ["objectId", "null"] },
    lastMessage: {
      bsonType: ["object", "null"],
      properties: {
        senderId: { bsonType: "objectId" },
        text: { bsonType: "string" },
        sentAt: { bsonType: "date" },
      },
    },
    createdAt: { bsonType: "date" },
    updatedAt: { bsonType: "date" },
  },
}));

database.createCollection("messages", opts({
  bsonType: "object",
  required: ["conversationId", "senderId", "text", "createdAt"],
  properties: {
    conversationId: { bsonType: "objectId" },
    senderId: { bsonType: "objectId" },
    text: { bsonType: "string", minLength: 1, maxLength: 2000 },
    readBy: { bsonType: "array", items: { bsonType: "objectId" } },
    createdAt: { bsonType: "date" },
  },
}));

// 1.5 accommodationListings: tin cho thuê phòng của chủ trọ
database.createCollection("accommodationListings", opts({
  bsonType: "object",
  required: ["ownerId", "title", "price", "address", "status", "moderationStatus", "createdAt"],
  properties: {
    ownerId: { bsonType: "objectId" },
    title: { bsonType: "string", maxLength: 150 },
    description: { bsonType: "string" },
    address: {
      bsonType: "object",
      required: ["city", "district"],
      properties: {
        city: { bsonType: "string" },
        district: { bsonType: "string" },
        ward: { bsonType: "string" },
        street: { bsonType: "string" },
      },
    },
    location: { // GeoJSON để tìm theo khoảng cách
      bsonType: "object",
      properties: {
        type: { enum: ["Point"] },
        coordinates: { bsonType: "array", items: { bsonType: "double" } }, // [lng, lat]
      },
    },
    price: { bsonType: "int", minimum: 0 },
    deposit: { bsonType: "int", minimum: 0 },
    area: { bsonType: "number", minimum: 0 }, // m2
    roomType: { enum: ["single", "shared", "studio", "apartment", "house"] },
    maxOccupants: { bsonType: "int", minimum: 1 },
    amenities: { bsonType: "array", items: { bsonType: "string" } },
    extraCosts: {
      bsonType: "object",
      properties: {
        electricity: { bsonType: "int" }, // VND/kWh
        water: { bsonType: "int" },       // VND/người/tháng hoặc /m3
        internet: { bsonType: "int" },
        other: { bsonType: "string" },
      },
    },
    images: { bsonType: "array", items: { bsonType: "string" } },
    rentalTerms: { bsonType: "string" },
    availableFrom: { bsonType: ["date", "null"] },
    status: { enum: ["available", "rented", "stopped"] },
    moderationStatus: { enum: ["pending", "approved", "rejected"] },
    viewCount: { bsonType: "int" },
    createdAt: { bsonType: "date" },
    updatedAt: { bsonType: "date" },
  },
}));

// 1.6 passListings: Pass Room + Pass Items (dùng chung 1 collection, phân biệt bằng "type")
database.createCollection("passListings", opts({
  bsonType: "object",
  required: ["ownerId", "type", "title", "status", "moderationStatus", "createdAt"],
  properties: {
    ownerId: { bsonType: "objectId" },
    type: { enum: ["room", "item"] },
    title: { bsonType: "string", maxLength: 150 },
    description: { bsonType: "string" },
    price: { bsonType: ["int", "null"], minimum: 0 }, // null hoặc 0 = cho tặng/thỏa thuận
    images: { bsonType: "array", items: { bsonType: "string" } },
    area: { bsonType: "string" },                     // khu vực giao nhận / vị trí
    contact: { bsonType: "string" },
    // Chỉ dùng khi type = "room"
    roomInfo: {
      bsonType: "object",
      properties: {
        address: { bsonType: "string" },
        deposit: { bsonType: "int" },
        remainingLeaseMonths: { bsonType: "int" },
        availableFrom: { bsonType: "date" },
        landlordAgreed: { bsonType: "bool" },
        transferTerms: { bsonType: "string" },
      },
    },
    // Chỉ dùng khi type = "item"
    itemInfo: {
      bsonType: "object",
      properties: {
        category: { enum: ["furniture", "appliance", "kitchen", "storage", "other"] },
        condition: { enum: ["new", "like_new", "good", "fair", "old"] },
        dealType: { enum: ["sell", "give_away", "exchange"] },
      },
    },
    status: { enum: ["active", "completed", "closed"] },
    moderationStatus: { enum: ["pending", "approved", "rejected"] },
    createdAt: { bsonType: "date" },
    updatedAt: { bsonType: "date" },
  },
}));

// 1.7 favorites: lưu phòng yêu thích
database.createCollection("favorites", opts({
  bsonType: "object",
  required: ["userId", "targetType", "targetId", "createdAt"],
  properties: {
    userId: { bsonType: "objectId" },
    targetType: { enum: ["accommodation", "pass"] },
    targetId: { bsonType: "objectId" },
    createdAt: { bsonType: "date" },
  },
}));

// 1.8 Gói dịch vụ, đăng ký, thanh toán
database.createCollection("subscriptionPlans", opts({
  bsonType: "object",
  required: ["code", "name", "price", "limits", "isActive"],
  properties: {
    code: { enum: ["basic", "plus", "pro"] },
    name: { bsonType: "string" },
    price: { bsonType: "int", minimum: 0 },     // VND / chu kỳ
    billingCycle: { enum: ["free", "monthly", "yearly"] },
    description: { bsonType: "string" },
    features: { bsonType: "array", items: { bsonType: "string" } },
    limits: {
      bsonType: "object",
      required: ["maxActivePassListings", "maxConnectionRequestsPerMonth", "maxMatchViewsPerDay", "canPostAccommodation", "maxActiveAccommodationListings"],
      properties: {
        maxActivePassListings: { bsonType: "int" },
        maxConnectionRequestsPerMonth: { bsonType: "int" },
        maxMatchViewsPerDay: { bsonType: "int" },
        canPostAccommodation: { bsonType: "bool" },
        maxActiveAccommodationListings: { bsonType: "int" },
        featuredListingsPerMonth: { bsonType: "int" },
      },
    },
    isActive: { bsonType: "bool" },
  },
}));

database.createCollection("userSubscriptions", opts({
  bsonType: "object",
  required: ["userId", "planCode", "status", "startedAt"],
  properties: {
    userId: { bsonType: "objectId" },
    planCode: { enum: ["basic", "plus", "pro"] },
    status: { enum: ["active", "expired", "cancelled", "pending_payment"] },
    startedAt: { bsonType: "date" },
    expiresAt: { bsonType: ["date", "null"] },
    autoRenew: { bsonType: "bool" },
  },
}));

database.createCollection("payments", opts({
  bsonType: "object",
  required: ["userId", "planCode", "amount", "status", "createdAt"],
  properties: {
    userId: { bsonType: "objectId" },
    subscriptionId: { bsonType: ["objectId", "null"] },
    planCode: { enum: ["plus", "pro"] },
    amount: { bsonType: "int", minimum: 0 },
    currency: { enum: ["VND"] },
    method: { enum: ["momo", "vnpay", "zalopay", "bank_transfer", "card"] },
    status: { enum: ["pending", "success", "failed", "refunded"] },
    transactionRef: { bsonType: ["string", "null"] },
    paidAt: { bsonType: ["date", "null"] },
    createdAt: { bsonType: "date" },
  },
}));

// 1.9 reports: báo cáo vi phạm
database.createCollection("reports", opts({
  bsonType: "object",
  required: ["reporterId", "targetType", "targetId", "reason", "status", "createdAt"],
  properties: {
    reporterId: { bsonType: "objectId" },
    targetType: { enum: ["user", "accommodation", "pass", "message"] },
    targetId: { bsonType: "objectId" },
    reason: { enum: ["spam", "scam", "fake_info", "harassment", "inappropriate", "duplicate", "other"] },
    detail: { bsonType: "string" },
    status: { enum: ["open", "reviewing", "resolved", "dismissed"] },
    handledBy: { bsonType: ["objectId", "null"] },
    resolution: { bsonType: ["string", "null"] },
    createdAt: { bsonType: "date" },
    resolvedAt: { bsonType: ["date", "null"] },
  },
}));

// 1.10 faqs: nội dung Help & Support
database.createCollection("faqs", opts({
  bsonType: "object",
  required: ["question", "answer", "category"],
  properties: {
    question: { bsonType: "string" },
    answer: { bsonType: "string" },
    category: { enum: ["account", "matching", "accommodation", "pass", "subscription", "safety"] },
    order: { bsonType: "int" },
    isPublished: { bsonType: "bool" },
  },
}));

/* ------------------------------------------------------------
 * 2. INDEX
 * ------------------------------------------------------------ */
database.users.createIndex({ email: 1 }, { unique: true });
database.users.createIndex({ status: 1, role: 1 });

database.profiles.createIndex({ userId: 1 }, { unique: true });
database.profiles.createIndex({ isLookingForRoommate: 1, "preferences.city": 1 });
database.profiles.createIndex({ "preferences.budget.min": 1, "preferences.budget.max": 1 });
database.profiles.createIndex({ "preferences.locations": 1 });

database.connections.createIndex({ requesterId: 1, receiverId: 1 }, { unique: true });
database.connections.createIndex({ receiverId: 1, status: 1 });
database.connections.createIndex({ requesterId: 1, status: 1 });

database.conversations.createIndex({ participants: 1, updatedAt: -1 });
database.messages.createIndex({ conversationId: 1, createdAt: -1 });

database.accommodationListings.createIndex({ location: "2dsphere" });
database.accommodationListings.createIndex({ title: "text", description: "text", "address.street": "text" }, { default_language: "none" });
database.accommodationListings.createIndex({ status: 1, moderationStatus: 1, price: 1 });
database.accommodationListings.createIndex({ "address.city": 1, "address.district": 1 });
database.accommodationListings.createIndex({ ownerId: 1, status: 1 });

database.passListings.createIndex({ title: "text", description: "text" }, { default_language: "none" });
database.passListings.createIndex({ type: 1, status: 1, moderationStatus: 1, createdAt: -1 });
database.passListings.createIndex({ ownerId: 1, status: 1 }); // đếm bài đang hoạt động để check hạn mức

database.favorites.createIndex({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });

database.subscriptionPlans.createIndex({ code: 1 }, { unique: true });
database.userSubscriptions.createIndex({ userId: 1, status: 1 });
database.userSubscriptions.createIndex({ expiresAt: 1 });
database.payments.createIndex({ userId: 1, createdAt: -1 });
database.payments.createIndex({ transactionRef: 1 }, { unique: true, sparse: true });

database.reports.createIndex({ status: 1, createdAt: -1 });
database.reports.createIndex({ targetType: 1, targetId: 1 });

/* ------------------------------------------------------------
 * 3. DỮ LIỆU MẪU
 * ------------------------------------------------------------ */

// 3.1 Gói dịch vụ (hạn mức mang tính đề xuất, chỉnh lại khi nhóm chốt chính sách)
database.subscriptionPlans.insertMany([
  {
    code: "basic", name: "Basic", price: 0, billingCycle: "free",
    description: "Miễn phí cho người dùng mới",
    features: ["Tạo hồ sơ Matching", "Xem hồ sơ bạn cùng phòng", "Tìm phòng trọ", "Tối đa 3 bài Pass đang hoạt động"],
    limits: {
      maxActivePassListings: 3, maxConnectionRequestsPerMonth: 5, maxMatchViewsPerDay: 10,
      canPostAccommodation: false, maxActiveAccommodationListings: 0, featuredListingsPerMonth: 0,
    },
    isActive: true,
  },
  {
    code: "plus", name: "Plus", price: 49000, billingCycle: "monthly",
    description: "Dành cho người tìm bạn cùng phòng thường xuyên",
    features: ["Hạn mức Matching cao hơn", "10 bài Pass đang hoạt động", "Đăng tin cho thuê phòng", "Bộ lọc nâng cao"],
    limits: {
      maxActivePassListings: 10, maxConnectionRequestsPerMonth: 30, maxMatchViewsPerDay: 50,
      canPostAccommodation: true, maxActiveAccommodationListings: 3, featuredListingsPerMonth: 0,
    },
    isActive: true,
  },
  {
    code: "pro", name: "Pro", price: 99000, billingCycle: "monthly",
    description: "Dành cho người dùng thường xuyên và chủ trọ chuyên nghiệp",
    features: ["Hạn mức cao nhất", "30 bài Pass đang hoạt động", "Đăng nhiều tin cho thuê", "Đẩy tin nổi bật", "Hỗ trợ ưu tiên"],
    limits: {
      maxActivePassListings: 30, maxConnectionRequestsPerMonth: 200, maxMatchViewsPerDay: 500,
      canPostAccommodation: true, maxActiveAccommodationListings: 20, featuredListingsPerMonth: 5,
    },
    isActive: true,
  },
]);

// 3.2 Users
// LƯU Ý: passwordHash dưới đây là CHỖ TRỐNG. Khi làm backend, hãy chạy lại bước "đặt mật khẩu mẫu" trong hướng dẫn.
const PLACEHOLDER_HASH = "$2b$10$REPLACE_WITH_REAL_BCRYPT_HASH_xxxxxxxxxxxxxxxxxxxxxxxxxxx";
const defaultSettings = {
  theme: "light", language: "vi",
  notifications: { connection: true, message: true, listing: true },
};

const ids = {
  admin: new ObjectId(), linh: new ObjectId(), minh: new ObjectId(), an: new ObjectId(),
  huy: new ObjectId(), trang: new ObjectId(), landlord: new ObjectId(),
};

database.users.insertMany([
  { _id: ids.admin, email: "admin@roomie.vn", passwordHash: PLACEHOLDER_HASH, role: "admin", status: "active", currentPlan: "pro", isLandlord: false, emailVerified: true, settings: defaultSettings, lastLoginAt: daysAgo(0), createdAt: daysAgo(90), updatedAt: daysAgo(0) },
  { _id: ids.linh, email: "linh.nguyen@example.com", passwordHash: PLACEHOLDER_HASH, role: "user", status: "active", currentPlan: "basic", isLandlord: false, emailVerified: true, settings: defaultSettings, lastLoginAt: daysAgo(1), createdAt: daysAgo(40), updatedAt: daysAgo(1) },
  { _id: ids.minh, email: "minh.tran@example.com", passwordHash: PLACEHOLDER_HASH, role: "user", status: "active", currentPlan: "basic", isLandlord: false, emailVerified: true, settings: { ...defaultSettings, theme: "dark" }, lastLoginAt: daysAgo(2), createdAt: daysAgo(35), updatedAt: daysAgo(2) },
  { _id: ids.an, email: "an.le@example.com", passwordHash: PLACEHOLDER_HASH, role: "user", status: "active", currentPlan: "plus", isLandlord: false, emailVerified: true, settings: defaultSettings, lastLoginAt: daysAgo(0), createdAt: daysAgo(30), updatedAt: daysAgo(0) },
  { _id: ids.huy, email: "huy.pham@example.com", passwordHash: PLACEHOLDER_HASH, role: "user", status: "active", currentPlan: "basic", isLandlord: false, emailVerified: true, settings: defaultSettings, lastLoginAt: daysAgo(3), createdAt: daysAgo(25), updatedAt: daysAgo(3) },
  { _id: ids.trang, email: "trang.vu@example.com", passwordHash: PLACEHOLDER_HASH, role: "user", status: "active", currentPlan: "basic", isLandlord: false, emailVerified: false, settings: defaultSettings, lastLoginAt: daysAgo(5), createdAt: daysAgo(10), updatedAt: daysAgo(5) },
  { _id: ids.landlord, email: "chutro.hoang@example.com", passwordHash: PLACEHOLDER_HASH, role: "user", status: "active", currentPlan: "pro", isLandlord: true, emailVerified: true, settings: defaultSettings, lastLoginAt: daysAgo(1), createdAt: daysAgo(60), updatedAt: daysAgo(1) },
]);

// 3.3 Profiles
const w = (b, l, s, c, li, p, sh, i) => ({ budget: b, location: l, schedule: s, cleanliness: c, lifestyle: li, privacy: p, sharedSpace: sh, interests: i });

database.profiles.insertMany([
  {
    userId: ids.admin, displayName: "Roomie Admin", avatarUrl: null, bio: "Quản trị viên hệ thống",
    isLookingForRoommate: false, createdAt: daysAgo(90), updatedAt: daysAgo(90),
  },
  {
    userId: ids.linh, displayName: "Nguyễn Khánh Linh", avatarUrl: "https://i.pravatar.cc/200?img=47",
    bio: "Sinh viên năm 3 FTU, thích yên tĩnh, ngăn nắp, hay học bài buổi tối.",
    gender: "female", birthYear: NumberInt(2004), school: "Đại học Ngoại thương", occupation: null,
    isLookingForRoommate: true,
    visibility: { school: true, occupation: true, budget: true, schedule: true, interests: true },
    preferences: {
      city: "Hà Nội", locations: ["Đống Đa", "Cầu Giấy"],
      budget: { min: NumberInt(2000000), max: NumberInt(3500000) },
      schedule: { sleepTime: "23:00", wakeTime: "06:30", pattern: "student" },
      cleanliness: NumberInt(5), noiseLevel: NumberInt(2), guestFrequency: "rarely",
      privacyNeed: NumberInt(4), sharedSpaceUsage: "moderate", smoking: false, pets: false,
      interests: ["đọc sách", "yoga", "nấu ăn"], requirements: ["Nữ", "Không hút thuốc"],
      weights: w(4, 3, 3, 5, 3, 4, 3, 1), dealBreakers: ["cleanliness", "lifestyle"],
    },
    createdAt: daysAgo(40), updatedAt: daysAgo(5),
  },
  {
    userId: ids.minh, displayName: "Trần Quang Minh", avatarUrl: "https://i.pravatar.cc/200?img=12",
    bio: "Sinh viên Bách Khoa, chơi game cuối tuần, dễ tính, thích nấu ăn chung.",
    gender: "male", birthYear: NumberInt(2003), school: "Đại học Bách khoa Hà Nội", occupation: null,
    isLookingForRoommate: true,
    visibility: { school: true, occupation: true, budget: true, schedule: true, interests: true },
    preferences: {
      city: "Hà Nội", locations: ["Hai Bà Trưng", "Thanh Xuân"],
      budget: { min: NumberInt(1500000), max: NumberInt(3000000) },
      schedule: { sleepTime: "00:30", wakeTime: "08:00", pattern: "student" },
      cleanliness: NumberInt(3), noiseLevel: NumberInt(3), guestFrequency: "sometimes",
      privacyNeed: NumberInt(3), sharedSpaceUsage: "open", smoking: false, pets: false,
      interests: ["game", "bóng đá", "nấu ăn"], requirements: ["Nam", "Thoải mái chia sẻ đồ dùng chung"],
      weights: w(4, 4, 2, 3, 3, 2, 3, 2), dealBreakers: ["budget"],
    },
    createdAt: daysAgo(35), updatedAt: daysAgo(6),
  },
  {
    userId: ids.an, displayName: "Lê Hoài An", avatarUrl: "https://i.pravatar.cc/200?img=32",
    bio: "Dev frontend mới chuyển lên Hà Nội, đi làm giờ hành chính, sạch sẽ, ít tiếp khách.",
    gender: "female", birthYear: NumberInt(1999), school: null, occupation: "Frontend Developer",
    isLookingForRoommate: true,
    visibility: { school: true, occupation: true, budget: true, schedule: true, interests: true },
    preferences: {
      city: "Hà Nội", locations: ["Cầu Giấy", "Nam Từ Liêm"],
      budget: { min: NumberInt(3000000), max: NumberInt(5000000) },
      schedule: { sleepTime: "23:30", wakeTime: "07:00", pattern: "office" },
      cleanliness: NumberInt(4), noiseLevel: NumberInt(2), guestFrequency: "rarely",
      privacyNeed: NumberInt(4), sharedSpaceUsage: "moderate", smoking: false, pets: true,
      interests: ["đọc sách", "cà phê", "chạy bộ"], requirements: ["Nữ", "Chấp nhận nuôi mèo"],
      weights: w(3, 4, 3, 4, 3, 4, 3, 2), dealBreakers: ["cleanliness"],
    },
    createdAt: daysAgo(30), updatedAt: daysAgo(3),
  },
  {
    userId: ids.huy, displayName: "Phạm Gia Huy", avatarUrl: "https://i.pravatar.cc/200?img=15",
    bio: "Làm freelance thiết kế, hay thức khuya, thích âm nhạc, hơi bừa nhưng biết dọn.",
    gender: "male", birthYear: NumberInt(2000), school: null, occupation: "Freelance Designer",
    isLookingForRoommate: true,
    visibility: { school: true, occupation: true, budget: true, schedule: false, interests: true },
    preferences: {
      city: "Hà Nội", locations: ["Thanh Xuân", "Đống Đa"],
      budget: { min: NumberInt(2500000), max: NumberInt(4000000) },
      schedule: { sleepTime: "02:00", wakeTime: "10:00", pattern: "freelance" },
      cleanliness: NumberInt(2), noiseLevel: NumberInt(4), guestFrequency: "often",
      privacyNeed: NumberInt(2), sharedSpaceUsage: "open", smoking: true, pets: false,
      interests: ["âm nhạc", "thiết kế", "phim"], requirements: ["Nam", "Không ngại tiếng nhạc"],
      weights: w(3, 3, 2, 2, 4, 2, 3, 3), dealBreakers: [],
    },
    createdAt: daysAgo(25), updatedAt: daysAgo(8),
  },
  {
    userId: ids.trang, displayName: "Vũ Thu Trang", avatarUrl: "https://i.pravatar.cc/200?img=44",
    bio: "Sinh viên Kinh tế Quốc dân, thích nấu ăn, tìm bạn nữ ở ghép khu Hai Bà Trưng.",
    gender: "female", birthYear: NumberInt(2004), school: "Đại học Kinh tế Quốc dân", occupation: null,
    isLookingForRoommate: true,
    visibility: { school: true, occupation: true, budget: true, schedule: true, interests: true },
    preferences: {
      city: "Hà Nội", locations: ["Hai Bà Trưng", "Đống Đa"],
      budget: { min: NumberInt(1800000), max: NumberInt(3200000) },
      schedule: { sleepTime: "23:00", wakeTime: "07:00", pattern: "student" },
      cleanliness: NumberInt(4), noiseLevel: NumberInt(2), guestFrequency: "sometimes",
      privacyNeed: NumberInt(3), sharedSpaceUsage: "moderate", smoking: false, pets: false,
      interests: ["nấu ăn", "yoga", "phim"], requirements: ["Nữ", "Không hút thuốc"],
      weights: w(4, 3, 3, 4, 3, 3, 3, 2), dealBreakers: ["lifestyle"],
    },
    createdAt: daysAgo(10), updatedAt: daysAgo(5),
  },
  {
    userId: ids.landlord, displayName: "Hoàng Văn Chủ Trọ", avatarUrl: "https://i.pravatar.cc/200?img=60",
    bio: "Chủ nhà trọ khu Cầu Giấy - Đống Đa, hơn 5 năm kinh nghiệm cho thuê.",
    gender: "male", birthYear: NumberInt(1980), school: null, occupation: "Chủ trọ",
    isLookingForRoommate: false,
    visibility: { school: false, occupation: true, budget: false, schedule: false, interests: false },
    createdAt: daysAgo(60), updatedAt: daysAgo(60),
  },
]);

// 3.4 Connections + hội thoại
const conn = {
  linhTrang: new ObjectId(), minhHuy: new ObjectId(), anLinh: new ObjectId(), trangMinh: new ObjectId(),
};

database.connections.insertMany([
  { _id: conn.linhTrang, requesterId: ids.linh, receiverId: ids.trang, status: "accepted", matchScore: 88, message: "Chào Trang, mình thấy mình hợp nhau, làm quen nhé!", respondedAt: daysAgo(4), createdAt: daysAgo(5) },
  { _id: conn.minhHuy, requesterId: ids.minh, receiverId: ids.huy, status: "accepted", matchScore: 74, message: "Hi, bạn có muốn ở ghép khu Thanh Xuân không?", respondedAt: daysAgo(6), createdAt: daysAgo(7) },
  { _id: conn.anLinh, requesterId: ids.an, receiverId: ids.linh, status: "pending", matchScore: 81, message: "Chào Linh, mình đang tìm bạn nữ ở Cầu Giấy.", respondedAt: null, createdAt: daysAgo(1) },
  { _id: conn.trangMinh, requesterId: ids.trang, receiverId: ids.minh, status: "rejected", matchScore: 52, message: null, respondedAt: daysAgo(2), createdAt: daysAgo(3) },
]);

const conv1 = new ObjectId();
const conv2 = new ObjectId();

database.conversations.insertMany([
  { _id: conv1, participants: [ids.linh, ids.trang], connectionId: conn.linhTrang, lastMessage: { senderId: ids.trang, text: "Mai mình đi xem phòng ở Đống Đa nhé!", sentAt: daysAgo(1) }, createdAt: daysAgo(4), updatedAt: daysAgo(1) },
  { _id: conv2, participants: [ids.minh, ids.huy], connectionId: conn.minhHuy, lastMessage: { senderId: ids.minh, text: "OK, vậy mình chốt khu Thanh Xuân nha", sentAt: daysAgo(5) }, createdAt: daysAgo(6), updatedAt: daysAgo(5) },
]);

database.messages.insertMany([
  { conversationId: conv1, senderId: ids.linh, text: "Chào Trang, bạn thường đi ngủ lúc mấy giờ?", readBy: [ids.linh, ids.trang], createdAt: daysAgo(4) },
  { conversationId: conv1, senderId: ids.trang, text: "Mình khoảng 11 giờ đêm, cũng thích yên tĩnh.", readBy: [ids.linh, ids.trang], createdAt: daysAgo(3) },
  { conversationId: conv1, senderId: ids.trang, text: "Mai mình đi xem phòng ở Đống Đa nhé!", readBy: [ids.trang], createdAt: daysAgo(1) },
  { conversationId: conv2, senderId: ids.minh, text: "Bạn có hay đưa bạn bè về phòng không?", readBy: [ids.minh, ids.huy], createdAt: daysAgo(6) },
  { conversationId: conv2, senderId: ids.huy, text: "Thỉnh thoảng thôi, cuối tuần.", readBy: [ids.minh, ids.huy], createdAt: daysAgo(6) },
  { conversationId: conv2, senderId: ids.minh, text: "OK, vậy mình chốt khu Thanh Xuân nha", readBy: [ids.minh, ids.huy], createdAt: daysAgo(5) },
]);

// 3.5 Tin cho thuê phòng
const acc = [new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId()];

database.accommodationListings.insertMany([
  {
    _id: acc[0], ownerId: ids.landlord, title: "Phòng trọ khép kín 25m2 gần ĐH Ngoại thương",
    description: "Phòng mới sơn, có ban công, an ninh tốt, giờ giấc tự do, gần trường và chợ.",
    address: { city: "Hà Nội", district: "Đống Đa", ward: "Láng Thượng", street: "Ngõ 52 Chùa Láng" },
    location: { type: "Point", coordinates: [105.8003, 21.0227] },
    price: NumberInt(3500000), deposit: NumberInt(3500000), area: 25, roomType: "single", maxOccupants: NumberInt(2),
    amenities: ["Điều hòa", "Nóng lạnh", "Giường", "Tủ quần áo", "Wifi", "Chỗ để xe"],
    extraCosts: { electricity: NumberInt(3800), water: NumberInt(100000), internet: NumberInt(100000), other: "Phí vệ sinh 30k/tháng" },
    images: ["https://picsum.photos/seed/room1a/800/600", "https://picsum.photos/seed/room1b/800/600"],
    rentalTerms: "Cọc 1 tháng, hợp đồng tối thiểu 6 tháng.", availableFrom: daysLater(7),
    status: "available", moderationStatus: "approved", viewCount: NumberInt(120), createdAt: daysAgo(12), updatedAt: daysAgo(2),
  },
  {
    _id: acc[1], ownerId: ids.landlord, title: "Phòng ở ghép 30m2, 2 giường, khu Cầu Giấy",
    description: "Phòng rộng, phù hợp 2 bạn nữ ở ghép, có bếp riêng, gần Đại học Quốc gia.",
    address: { city: "Hà Nội", district: "Cầu Giấy", ward: "Dịch Vọng", street: "Ngõ 120 Trần Quốc Hoàn" },
    location: { type: "Point", coordinates: [105.7899, 21.0371] },
    price: NumberInt(5200000), deposit: NumberInt(5200000), area: 30, roomType: "shared", maxOccupants: NumberInt(2),
    amenities: ["Điều hòa", "Nóng lạnh", "Bếp riêng", "Máy giặt chung", "Wifi"],
    extraCosts: { electricity: NumberInt(3800), water: NumberInt(80000), internet: NumberInt(0), other: "" },
    images: ["https://picsum.photos/seed/room2a/800/600"],
    rentalTerms: "Cọc 1 tháng, ưu tiên nữ, không hút thuốc.", availableFrom: daysLater(3),
    status: "available", moderationStatus: "approved", viewCount: NumberInt(85), createdAt: daysAgo(8), updatedAt: daysAgo(1),
  },
  {
    _id: acc[2], ownerId: ids.landlord, title: "Studio 35m2 full nội thất Thanh Xuân",
    description: "Studio mới, full nội thất, thang máy, bảo vệ 24/7.",
    address: { city: "Hà Nội", district: "Thanh Xuân", ward: "Nhân Chính", street: "Ngõ 70 Nguyễn Tuân" },
    location: { type: "Point", coordinates: [105.8021, 21.0013] },
    price: NumberInt(6500000), deposit: NumberInt(6500000), area: 35, roomType: "studio", maxOccupants: NumberInt(2),
    amenities: ["Điều hòa", "Nóng lạnh", "Giường", "Tủ lạnh", "Máy giặt", "Thang máy", "Bảo vệ 24/7"],
    extraCosts: { electricity: NumberInt(4000), water: NumberInt(120000), internet: NumberInt(100000), other: "" },
    images: ["https://picsum.photos/seed/room3a/800/600", "https://picsum.photos/seed/room3b/800/600"],
    rentalTerms: "Cọc 1 tháng, hợp đồng 12 tháng.", availableFrom: daysLater(14),
    status: "available", moderationStatus: "approved", viewCount: NumberInt(60), createdAt: daysAgo(6), updatedAt: daysAgo(6),
  },
  {
    _id: acc[3], ownerId: ids.landlord, title: "Phòng trọ giá rẻ 18m2 Hai Bà Trưng",
    description: "Phòng nhỏ gọn, giá sinh viên, gần ĐH Kinh tế Quốc dân và Bách Khoa.",
    address: { city: "Hà Nội", district: "Hai Bà Trưng", ward: "Bách Khoa", street: "Ngõ 35 Đại Cồ Việt" },
    location: { type: "Point", coordinates: [105.8465, 21.0053] },
    price: NumberInt(2200000), deposit: NumberInt(2200000), area: 18, roomType: "single", maxOccupants: NumberInt(2),
    amenities: ["Nóng lạnh", "Giường", "Wifi", "Chỗ để xe"],
    extraCosts: { electricity: NumberInt(3500), water: NumberInt(60000), internet: NumberInt(50000), other: "" },
    images: ["https://picsum.photos/seed/room4a/800/600"],
    rentalTerms: "Cọc 1 tháng.", availableFrom: daysLater(1),
    status: "available", moderationStatus: "approved", viewCount: NumberInt(200), createdAt: daysAgo(15), updatedAt: daysAgo(4),
  },
  {
    _id: acc[4], ownerId: ids.landlord, title: "Căn hộ mini 28m2 Nam Từ Liêm (đã cho thuê)",
    description: "Căn hộ mini có ban công, đã có người thuê.",
    address: { city: "Hà Nội", district: "Nam Từ Liêm", ward: "Mỹ Đình 1", street: "Ngõ 18 Lê Đức Thọ" },
    location: { type: "Point", coordinates: [105.7647, 21.0287] },
    price: NumberInt(4800000), deposit: NumberInt(4800000), area: 28, roomType: "apartment", maxOccupants: NumberInt(2),
    amenities: ["Điều hòa", "Nóng lạnh", "Bếp", "Wifi"],
    extraCosts: { electricity: NumberInt(3800), water: NumberInt(100000), internet: NumberInt(0), other: "" },
    images: [], rentalTerms: "Cọc 1 tháng.", availableFrom: null,
    status: "rented", moderationStatus: "approved", viewCount: NumberInt(40), createdAt: daysAgo(30), updatedAt: daysAgo(10),
  },
]);

// 3.6 Pass Room + Pass Items
const pass = [new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId()];

database.passListings.insertMany([
  {
    _id: pass[0], ownerId: ids.minh, type: "room", title: "Pass phòng trọ 20m2 Thanh Xuân, còn 5 tháng hợp đồng",
    description: "Cần pass gấp do chuyển công tác, chủ nhà đã đồng ý cho chuyển nhượng.",
    price: NumberInt(3000000), images: ["https://picsum.photos/seed/pass1/800/600"], area: "Thanh Xuân, Hà Nội", contact: "Zalo: 0900000001",
    roomInfo: { address: "Ngõ 100 Nguyễn Trãi, Thanh Xuân", deposit: NumberInt(3000000), remainingLeaseMonths: NumberInt(5), availableFrom: daysLater(10), landlordAgreed: true, transferTerms: "Bên nhận chuyển phần cọc cho bên pass." },
    status: "active", moderationStatus: "approved", createdAt: daysAgo(4), updatedAt: daysAgo(4),
  },
  {
    _id: pass[1], ownerId: ids.huy, type: "item", title: "Bàn học gỗ 1m2 + ghế, còn mới 90%",
    description: "Dùng 1 năm, không trầy xước, tự vận chuyển hoặc hỗ trợ ship nội thành.",
    price: NumberInt(450000), images: ["https://picsum.photos/seed/pass2/800/600"], area: "Thanh Xuân, Hà Nội", contact: "Zalo: 0900000002",
    itemInfo: { category: "furniture", condition: "like_new", dealType: "sell" },
    status: "active", moderationStatus: "approved", createdAt: daysAgo(3), updatedAt: daysAgo(3),
  },
  {
    _id: pass[2], ownerId: ids.linh, type: "item", title: "Tủ quần áo vải 3 ngăn",
    description: "Tủ vải dễ lắp ráp, còn tốt, cho lại bạn nào cần.",
    price: NumberInt(0), images: [], area: "Đống Đa, Hà Nội", contact: "Zalo: 0900000003",
    itemInfo: { category: "storage", condition: "good", dealType: "give_away" },
    status: "active", moderationStatus: "approved", createdAt: daysAgo(2), updatedAt: daysAgo(2),
  },
  {
    _id: pass[3], ownerId: ids.an, type: "item", title: "Quạt điều hòa mini + nồi cơm điện 1.2L",
    description: "Combo đồ gia dụng nhỏ, bán chung hoặc lẻ.",
    price: NumberInt(600000), images: ["https://picsum.photos/seed/pass4/800/600"], area: "Cầu Giấy, Hà Nội", contact: "Zalo: 0900000004",
    itemInfo: { category: "appliance", condition: "good", dealType: "sell" },
    status: "active", moderationStatus: "pending", createdAt: daysAgo(1), updatedAt: daysAgo(1),
  },
  {
    _id: pass[4], ownerId: ids.trang, type: "item", title: "Bộ nồi chảo + dụng cụ nhà bếp",
    description: "Đã bán xong.",
    price: NumberInt(300000), images: [], area: "Hai Bà Trưng, Hà Nội", contact: "Zalo: 0900000005",
    itemInfo: { category: "kitchen", condition: "fair", dealType: "sell" },
    status: "completed", moderationStatus: "approved", createdAt: daysAgo(20), updatedAt: daysAgo(9),
  },
]);

// 3.7 Favorites
database.favorites.insertMany([
  { userId: ids.linh, targetType: "accommodation", targetId: acc[0], createdAt: daysAgo(3) },
  { userId: ids.linh, targetType: "accommodation", targetId: acc[1], createdAt: daysAgo(2) },
  { userId: ids.trang, targetType: "accommodation", targetId: acc[3], createdAt: daysAgo(2) },
  { userId: ids.minh, targetType: "pass", targetId: pass[1], createdAt: daysAgo(1) },
]);

// 3.8 Subscriptions + payments
const sub = { an: new ObjectId(), landlord: new ObjectId() };

database.userSubscriptions.insertMany([
  { userId: ids.linh, planCode: "basic", status: "active", startedAt: daysAgo(40), expiresAt: null, autoRenew: false },
  { userId: ids.minh, planCode: "basic", status: "active", startedAt: daysAgo(35), expiresAt: null, autoRenew: false },
  { _id: sub.an, userId: ids.an, planCode: "plus", status: "active", startedAt: daysAgo(10), expiresAt: daysLater(20), autoRenew: true },
  { userId: ids.huy, planCode: "basic", status: "active", startedAt: daysAgo(25), expiresAt: null, autoRenew: false },
  { userId: ids.trang, planCode: "basic", status: "active", startedAt: daysAgo(10), expiresAt: null, autoRenew: false },
  { _id: sub.landlord, userId: ids.landlord, planCode: "pro", status: "active", startedAt: daysAgo(30), expiresAt: daysLater(0), autoRenew: true },
]);

database.payments.insertMany([
  { userId: ids.an, subscriptionId: sub.an, planCode: "plus", amount: NumberInt(49000), currency: "VND", method: "momo", status: "success", transactionRef: "MOMO-20260001", paidAt: daysAgo(10), createdAt: daysAgo(10) },
  { userId: ids.landlord, subscriptionId: sub.landlord, planCode: "pro", amount: NumberInt(99000), currency: "VND", method: "vnpay", status: "success", transactionRef: "VNPAY-20260002", paidAt: daysAgo(30), createdAt: daysAgo(30) },
  { userId: ids.huy, subscriptionId: null, planCode: "plus", amount: NumberInt(49000), currency: "VND", method: "momo", status: "failed", transactionRef: "MOMO-20260003", paidAt: null, createdAt: daysAgo(5) },
]);

// 3.9 Reports
database.reports.insertMany([
  { reporterId: ids.linh, targetType: "pass", targetId: pass[3], reason: "duplicate", detail: "Bài đăng này bị trùng với bài cũ của cùng tài khoản.", status: "open", handledBy: null, resolution: null, createdAt: daysAgo(1), resolvedAt: null },
  { reporterId: ids.trang, targetType: "user", targetId: ids.huy, reason: "inappropriate", detail: "Tin nhắn có nội dung không phù hợp.", status: "reviewing", handledBy: ids.admin, resolution: null, createdAt: daysAgo(2), resolvedAt: null },
  { reporterId: ids.minh, targetType: "accommodation", targetId: acc[4], reason: "fake_info", detail: "Phòng đã cho thuê nhưng vẫn hiển thị.", status: "resolved", handledBy: ids.admin, resolution: "Đã chuyển trạng thái sang 'rented'.", createdAt: daysAgo(12), resolvedAt: daysAgo(10) },
]);

// 3.10 FAQs
database.faqs.insertMany([
  { question: "Tỷ lệ Matching được tính như thế nào?", answer: "Roomie so sánh hồ sơ của hai người theo các nhóm tiêu chí như ngân sách, khu vực, lịch sinh hoạt, mức độ sạch sẽ, lối sống... Đây là chỉ số ước tính, không đảm bảo hai người chắc chắn hòa hợp.", category: "matching", order: NumberInt(1), isPublished: true },
  { question: "Tôi có thể ẩn thông tin cá nhân không?", answer: "Có. Trong hồ sơ, bạn chọn thông tin nào hiển thị công khai, thông tin nào chỉ dùng để tính Matching.", category: "account", order: NumberInt(2), isPublished: true },
  { question: "Tài khoản Basic được đăng mấy bài Pass?", answer: "Tối đa 3 bài đang hoạt động, tính chung Pass Room và Pass Items.", category: "pass", order: NumberInt(3), isPublished: true },
  { question: "Làm sao để đăng tin cho thuê phòng?", answer: "Tính năng này dành cho tài khoản được cấp quyền (gói Plus/Pro và đáp ứng điều kiện người đăng).", category: "accommodation", order: NumberInt(4), isPublished: true },
  { question: "Làm sao để báo cáo người dùng hoặc bài đăng?", answer: "Nhấn nút Báo cáo trên hồ sơ hoặc bài đăng, chọn lý do và mô tả chi tiết. Đội ngũ quản trị sẽ xem xét.", category: "safety", order: NumberInt(5), isPublished: true },
]);

/* ------------------------------------------------------------
 * 4. KIỂM TRA NHANH
 * ------------------------------------------------------------ */
print("\n=== ROOMIE DB đã được tạo ===");
database.getCollectionNames().sort().forEach((c) => {
  print(c.padEnd(24) + database.getCollection(c).countDocuments());
});
