import { Router } from "express";
import {
  listConversations, getMessages, sendMessage, getMessageImage, startConversation,
} from "../controllers/conversationController.js";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { uploadChatImages } from "../middlewares/upload.js";
import { sendMessageRules, startConversationRules } from "../validators/chatValidator.js";

const router = Router();
router.use(requireAuth);

router.get("/", listConversations);
router.post("/start", startConversationRules, validate, startConversation);
router.get("/:id/messages", getMessages);
router.get("/:id/images/:filename", getMessageImage);

// Nhận cả JSON (chỉ chữ) lẫn multipart (có ảnh); multer tự bỏ qua request không phải multipart
router.post("/:id/messages", uploadChatImages, sendMessageRules, validate, sendMessage);

export default router;