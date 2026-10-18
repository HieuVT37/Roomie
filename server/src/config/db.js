import mongoose from "mongoose";

// Collection messages từng có validator bắt text tối thiểu 1 ký tự nên tin nhắn chỉ có ảnh bị từ chối
// ("Document failed validation"). Dữ liệu đã được Mongoose kiểm tra ở tầng ứng dụng, nên tắt hẳn validator
// của collection này. Chạy mỗi lần khởi động nên database nào (local hay Atlas) cũng được cập nhật.
async function ensureMessageSchema() {
  try {
    await mongoose.connection.db.command({ collMod: "messages", validator: {}, validationLevel: "off" });
    console.log("Đã tắt validator cũ của collection messages (cho phép tin nhắn chỉ có ảnh)");
  } catch (err) {
    if (err.codeName === "NamespaceNotFound") {
      await mongoose.connection.createCollection("messages").catch(() => {});
      return;
    }
    console.warn("KHÔNG cập nhật được collection messages, gửi ảnh có thể lỗi:", err.message);
  }
}

export async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected:", mongoose.connection.name);
  await ensureMessageSchema();
}
