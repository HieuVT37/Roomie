import "dotenv/config";
import mongoose from "mongoose";

await mongoose.connect(process.env.MONGO_URI);

await mongoose.connection.db.command({
  collMod: "messages",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["conversationId", "senderId", "createdAt"],
      properties: {
        conversationId: { bsonType: "objectId" },
        senderId: { bsonType: "objectId" },
        text: { bsonType: "string", maxLength: 2000 },
        images: { bsonType: "array", maxItems: 4, items: { bsonType: "string" } },
        readBy: { bsonType: "array", items: { bsonType: "objectId" } },
        createdAt: { bsonType: "date" },
      },
    },
  },
  validationLevel: "moderate",
  validationAction: "error",
});

console.log("Đã cập nhật schema collection messages (cho phép tin nhắn chỉ có ảnh)");
await mongoose.disconnect();