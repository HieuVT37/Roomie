import { Router } from "express";
import rateLimit from "express-rate-limit";

const router = Router();

const limiter = rateLimit({ windowMs: 60 * 1000, max: 10 });
router.use(limiter);

// Mô hình Gemini: mặc định Flash-Lite (miễn phí, nhanh, hạn mức/ngày cao nhất trong gói free).
// Đổi mô hình bằng biến môi trường GEMINI_MODEL, không cần sửa code.
const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const SYSTEM_PROMPT = `Bạn là Roomie AI, trợ lý của Roomie — ứng dụng giúp sinh viên và người trẻ tại Hà Nội.
Các mục trên thanh menu và chức năng:
- "Matching": gợi ý bạn cùng phòng theo 8 tiêu chí (ngân sách, khu vực, giờ giấc, sạch sẽ, lối sống, riêng tư, không gian chung, sở thích), hiển thị % phù hợp. Chỉ ghép người cùng giới tính. Cần hoàn thiện hồ sơ và bật "Đang tìm bạn cùng phòng".
- "Tìm phòng": tìm phòng trọ, lọc theo quận/huyện (gõ không dấu cũng được), giá, diện tích, tiện nghi. Chủ trọ đăng tin cần gói có quyền đăng tin.
- "Pass": nhượng lại phòng còn hợp đồng, mua bán / cho tặng đồ dùng.
- "Kết nối": lời mời kết nối đã gửi / đã nhận; chấp nhận kết nối thì mới nhắn tin được.
- "Tin nhắn": trò chuyện với người đã kết nối.
- "Yêu thích": phòng và bài Pass đã lưu.
- "Gói dịch vụ": Basic miễn phí, Plus và Pro trả phí theo 30 ngày (nhiều lượt kết nối, lượt xem hồ sơ, tin đăng hơn).
- "Hỗ trợ": câu hỏi thường gặp. Bấm ảnh đại diện để vào "Hồ sơ" (sửa thông tin, ảnh đại diện, đổi mật khẩu).
- Đăng ký cần xác thực email bằng mã 6 số; quên mật khẩu thì bấm "Quên mật khẩu?" ở trang đăng nhập.
- Tin đăng phòng và Pass được duyệt trước khi hiển thị; gặp vi phạm thì bấm "Báo cáo vi phạm".
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