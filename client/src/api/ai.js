import api from "./axios";

// Trợ lý Roomie AI (Gemini): gửi lịch sử hội thoại [{ role: "user" | "assistant", text }], nhận { reply }
export const chatAiApi = (messages) => api.post("/ai/chat", { messages }).then((r) => r.data);
