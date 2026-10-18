import fs from "node:fs";
import path from "node:path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import routes from "./routes/index.js";
import fileRoutes from "./routes/fileRoutes.js";
import { CLIENT_DIST, CLIENT_INDEX } from "./config/paths.js";
import { apiLimiter } from "./middlewares/rateLimit.js";
import { notFound, errorHandler } from "./middlewares/error.js";

const app = express();
const isProd = process.env.NODE_ENV === "production";

// Render đứng sau một proxy: cần để lấy đúng IP người dùng (giới hạn tần suất) và nhận biết HTTPS
app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        // Cho phép ảnh từ chính site, ảnh xem trước (blob:), và ảnh https (ví dụ link ảnh đại diện)
        "img-src": ["'self'", "data:", "blob:", "https:"],
        // Chạy thử bản build ở http://localhost thì không được ép nâng cấp lên https
        ...(isProd ? {} : { "upgrade-insecure-requests": null }),
      },
    },
  })
);
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(morgan(isProd ? "combined" : "dev"));
app.use(express.json());
app.use(cookieParser());

app.use("/uploads", fileRoutes);
app.use("/api", apiLimiter, routes);

// Phục vụ giao diện React nếu đã build (client/dist)
if (fs.existsSync(CLIENT_INDEX)) {
  app.use(express.static(CLIENT_DIST, { index: false, maxAge: "7d" })); // file build có mã băm trong tên
  app.use((req, res, next) => {
    const isPage = req.method === "GET" && !path.extname(req.path);
    if (!isPage || req.path.startsWith("/api/") || req.path.startsWith("/uploads/")) return next();
    res.set("Cache-Control", "no-cache"); // luôn lấy index.html mới sau mỗi lần cập nhật
    res.sendFile(CLIENT_INDEX);
  });
}

app.use(notFound);
app.use(errorHandler);

export default app;