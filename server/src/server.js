import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const missing = ["MONGO_URI", "JWT_SECRET"].filter((k) => !process.env[k]);
if (missing.length) {
  console.error("Thiếu biến môi trường:", missing.join(", "));
  process.exit(1);
}
if (process.env.NODE_ENV === "production" && process.env.JWT_SECRET.length < 32) {
  console.error("JWT_SECRET phải dài ít nhất 32 ký tự khi chạy thật");
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => app.listen(PORT, () => console.log(`API chạy tại http://localhost:${PORT}`)))
  .catch((err) => {
    console.error("Không kết nối được MongoDB:", err.message);
    process.exit(1);
  });