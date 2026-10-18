import mongoose from "mongoose";

const { Schema } = mongoose;

// Ảnh được lưu thẳng trong database (vì ổ đĩa của Render miễn phí không giữ được file)
const storedFileSchema = new Schema(
  {
    kind: { type: String, enum: ["public", "chat"], required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", default: null },
    contentType: { type: String, default: "image/webp" },
    size: { type: Number, default: 0 },
    data: { type: Buffer, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "files" }
);

storedFileSchema.index({ ownerId: 1, kind: 1 });
storedFileSchema.index({ conversationId: 1 });

export default mongoose.model("StoredFile", storedFileSchema);