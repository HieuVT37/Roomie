// Gọi Gemini và nhận kết quả JSON theo schema cố định.
// Mô hình đổi bằng biến môi trường GEMINI_MODEL (mặc định giống chatbot ở routes/aiRoutes.js).

export const geminiModel = () => process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

// Lỗi khi AI không dùng được (thiếu key, hết hạn mức, quá thời gian, trả về sai định dạng)
export class AiUnavailableError extends Error {}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Gemini quá tải (503) thường hết sau vài giây: thử lại 1 lần. Lần gọi lỗi không tính token.
export async function generateJson(options) {
  try {
    return await generateJsonOnce(options);
  } catch (err) {
    if (!(err instanceof AiUnavailableError) || !err.retryable) throw err;
    await sleep(1500);
    return generateJsonOnce(options);
  }
}

async function generateJsonOnce({ system, prompt, schema, temperature = 0.4, maxOutputTokens = 1024, timeoutMs = 20_000 }) {
  if (!process.env.GEMINI_API_KEY) throw new AiUnavailableError("Chưa cấu hình GEMINI_API_KEY");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel()}:generateContent`;
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature, maxOutputTokens, responseMimeType: "application/json", responseSchema: schema },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    throw new AiUnavailableError(`Không gọi được Gemini: ${err.message}`);
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new AiUnavailableError(`Gemini trả lỗi ${res.status}: ${JSON.stringify(data?.error ?? data)}`);
    err.retryable = res.status === 503 || res.status === 500;
    throw err;
  }

  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
  try {
    return JSON.parse(text);
  } catch {
    throw new AiUnavailableError(`Gemini trả về không phải JSON: ${text.slice(0, 200)}`);
  }
}
