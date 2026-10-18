import { Router } from "express";
import {
  listConversations, getMessages, sendMessage, getMessageImage,
} from "../controllers/conversationController.js";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { uploadChatImages, cleanupUploadsOnError } from "../middlewares/upload.js";
import { sendMessageRules } from "../validators/chatValidator.js";

const router = Router();
router.use(requireAuth);

router.get("/", listConversations);
router.get("/:id/messages", getMessages);
router.get("/:id/images/:filename", getMessageImage);

router.post("/:id/messages", cleanupUploadsOnError, uploadChatImages, sendMessageRules, validate, sendMessage);

export default router;