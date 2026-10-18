import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => app.listen(PORT, () => console.log(`API chạy tại http://localhost:${PORT}`)))
  .catch((err) => {
    console.error("Không kết nối được MongoDB:", err.message);
    process.exit(1);
  });