import Faq from "../models/Faq.js";
import { asyncHandler } from "../utils/httpError.js";

export const listFaqs = asyncHandler(async (req, res) => {
  const items = await Faq.find({ isPublished: true }).sort({ category: 1, order: 1 }).lean();
  res.json({
    items: items.map((f) => ({ id: f._id, question: f.question, answer: f.answer, category: f.category })),
  });
});