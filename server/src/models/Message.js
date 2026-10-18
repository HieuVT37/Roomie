import mongoose from "mongoose";

const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, trim: true, maxlength: 2000, default: "" },
    images: [{ type: String }], // tên file trong thư mục ảnh chat riêng tư
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "messages" }
);

// Tin nhắn phải có chữ hoặc ít nhất một ảnh
messageSchema.pre("validate", function () {
  if (!this.text && !this.images?.length) {
    throw new Error("Tin nhắn không được để trống");
  }
});

export default mongoose.model("Message", messageSchema);