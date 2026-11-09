# Roomie

Ứng dụng web giúp sinh viên/người trẻ tại Hà Nội: tìm phòng trọ, pass đồ, ghép bạn ở cùng (matching), kết nối & nhắn tin, gói dịch vụ trả phí, trang quản trị. Giao diện và thông báo lỗi bằng tiếng Việt.

## Stack & lệnh chạy

- `server/`: Node.js (ESM, `"type": "module"`), Express, Mongoose/MongoDB, JWT (cookie `token` hoặc `Authorization: Bearer`), express-validator, multer.
- `client/`: React + Vite + Tailwind v4, axios (`client/src/api/axios.js`), React Router.
- `database/roomie_init.js`: script mongosh tạo collection + validator + dữ liệu mẫu (**xóa DB `roomie` cũ**): `mongosh "mongodb://localhost:27017" database/roomie_init.js`.

```bash
cd server && npm install && npm run dev     # API, mặc định cổng 5000
cd client && npm install && npm run dev     # Vite, http://localhost:5173
cd client && npm run lint
npm run build && npm start                  # (gốc) build client, server phục vụ client/dist (deploy Render)
```
Script tiện ích server: `seed:passwords`, `seed:subscriptions`, `migrate:messages`.
Biến môi trường: xem `server/.env.example` (PORT, MONGO_URI, JWT_EXPIRES_IN, CLIENT_URL, PAYMENT_MODE=mock); ngoài ra cần `JWT_SECRET`, `GEMINI_API_KEY` (cho `/api/ai/chat`).
Chưa có test tự động.

## Kiến trúc server (`server/src`)

`routes/index.js` gắn mọi router dưới `/api` → `routes/*Routes.js` → (validator `validators/*` + `middlewares/validate.js`) → `controllers/*` → `models/*`; logic dùng chung trong `services/*`.

- Lỗi: ném `httpError(status, message, code)` bên trong `asyncHandler` (`utils/httpError.js`); `middlewares/error.js` trả JSON.
- Xác thực: `middlewares/auth.js` — `requireAuth`, `optionalAuth`, kiểm tra quyền admin. Mỗi request đã đăng nhập gọi `ensurePlanFresh` (tự hạ gói hết hạn về basic).
- Hạn mức theo gói (basic/plus/pro): `services/planService.js#getPlanLimits` (đọc `SubscriptionPlan`, có giá trị dự phòng). Luôn kiểm tra hạn mức ở backend.
- Bài đăng mới (phòng, pass) có `moderation: "pending"`, admin duyệt mới hiển thị công khai.
- Ảnh lưu trong MongoDB (`StoredFile`), phục vụ qua `routes/fileRoutes.js`; upload qua `uploadRoutes.js` + `services/imageService.js`.

## 6 module nghiệp vụ

| Module | Server | Client |
|---|---|---|
| Tài khoản & Gói dịch vụ | `authController`, `profileController`, `billingController`, `services/billingService.js` (activatePlan: cùng gói thì gia hạn, khác gói thì thay; Pro tự có `isLandlord`), `planService.js` | `pages/auth`, `pages/profile`, `pages/billing`, `context/AuthContext.jsx` |
| Matching | `services/matchingService.js` (8 tiêu chí 0..1, trọng số mặc định 3, điểm đối xứng, dealBreaker < 0.4 ⇒ không hợp), `matchingController` (giới hạn lượt xem/ngày qua `MatchView`) | `pages/matching` |
| Kết nối & Tin nhắn | `connectionController`, `services/connectionService.js` (trạng thái pending/accepted/rejected/cancelled/blocked; mỗi kết nối được chấp nhận có đúng 1 Conversation; giới hạn yêu cầu/tháng), `conversationController`, `notificationController` | `pages/connections`, `pages/messages/MessagesPage.jsx`, `context/NotificationContext.jsx` |
| Tìm phòng | `accommodationController` (chỉ gói có `canPostAccommodation`) | `pages/accommodation` |
| Pass đồ + Yêu thích | `passController` (type `room`/`item`; `give_away` ⇒ giá 0), `favoriteController` | `pages/pass`, `pages/favorites` |
| Admin & Hỗ trợ | `adminController` (thống kê, user, cấp gói, duyệt bài, báo cáo, gói, FAQ), `reportController`, `faqController`; `routes/aiRoutes.js` (chatbot Gemini, client chưa dùng) | `pages/admin`, `layouts/AdminLayout.jsx`, `pages/support` |

## Quy ước

- Comment và chuỗi hiển thị viết tiếng Việt.
- Controller trả DTO (`toDto`, `toPassDto`, `toPublicProfile`), không trả document thô.
- Client gọi API qua module trong `client/src/api/*`, nhãn hiển thị dùng `utils/labels.js`.
