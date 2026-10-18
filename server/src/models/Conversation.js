import mongoose from "mongoose";

const { Schema } = mongoose;

const conversationSchema = new Schema(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    connectionId: { type: Schema.Types.ObjectId, ref: "Connection", default: null },
    lastMessage: {
      senderId: { type: Schema.Types.ObjectId, ref: "User" },
      text: String,
      sentAt: Date,
    },
  },
  { timestamps: true, collection: "conversations" }
);

export default mongoose.model("Conversation", conversationSchema);