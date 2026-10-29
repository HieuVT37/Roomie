import { Router } from "express";
import rateLimit from "express-rate-limit";

const limiter = rateLimit({ windowMs: 60 * 1000, max: 10 });
router.use(limiter);

const router = Router();

const MODEL = "gemini-2.5-flash"; // đổi theo model có trong Google AI Studio
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const SYSTEM_PROMPT = `Bạn là trợ lý AI của Roomie, ứng dụng giúp sinh viên và người trẻ tại Hà Nội:
- Tìm phòng trọ, ở ghép (tab "Tìm phòng")
- Mua bán, pass lại đồ dùng, cho tặng đồ (tab "Pass")
- Ghép đôi bạn ở cùng (roommate matching) theo ngân sách, khu vực, thói quen; hiển thị % phù hợp (tab "Kết nối")
- Nhắn tin với người dùng khác (tab "Tin nhắn")
- Quản lý hồ sơ, gói dịch vụ, hỗ trợ (tab "Tài khoản")
Quy tắc: trả lời bằng tiếng Việt, ngắn gọn, thân thiện. Hướng dẫn người dùng thao tác trong app khi phù hợp.
Chỉ trả lời các chủ đề liên quan đến Roomie, thuê/tìm phòng, pass đồ, chọn bạn cùng phòng, an toàn khi giao dịch.
Không bịa thông tin về giá, phòng hay người dùng cụ thể; nếu không biết hãy nói rõ và gợi ý người dùng xem trong app.`;

router.post("/chat", async (req, res) => {
  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: "Thiếu nội dung câu hỏi" });
    }

    const contents = messages.slice(-12).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.text || "").slice(0, 1000) }],
    }));
    // Gemini yêu cầu hội thoại bắt đầu bằng lượt của người dùng
    while (contents.length && contents[0].role === "model") contents.shift();
    if (!contents.length) {
      return res.status(400).json({ message: "Nội dung không hợp lệ" });
    }

    const r = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { maxOutputTokens: 800, temperature: 0.7 },
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      console.error("Gemini error:", JSON.stringify(data));
      return res.status(502).json({ message: "Trợ lý AI tạm thời không phản hồi" });
    }
    const reply =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ||
      "Mình chưa trả lời được câu này, bạn thử hỏi lại nhé.";
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
});

export default router;