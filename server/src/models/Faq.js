import mongoose from "mongoose";

const { Schema } = mongoose;

const faqSchema = new Schema(
  {
    question: { type: String, required: true, trim: true, maxlength: 300 },
    answer: { type: String, required: true, trim: true, maxlength: 3000 },
    category: {
      type: String,
      enum: ["account", "matching", "accommodation", "pass", "subscription", "safety"],
      required: true,
    },
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { collection: "faqs" }
);

export default mongoose.model("Faq", faqSchema);