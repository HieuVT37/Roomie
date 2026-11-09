import nodemailer from "nodemailer";

// =====================================================================
// Gửi email (miễn phí). Chọn bằng biến môi trường MAIL_PROVIDER:
//   gmail   — Gmail SMTP qua Mật khẩu ứng dụng (GMAIL_USER, GMAIL_APP_PASSWORD), ~500 mail/ngày
//   brevo   — Brevo API qua HTTPS (BREVO_API_KEY, MAIL_FROM), 300 mail/ngày, chạy được trên Render
//             kể cả khi gói miễn phí chặn cổng SMTP
//   console — không gửi thật, in nội dung ra terminal (chỉ để phát triển trên máy)
// Không đặt MAIL_PROVIDER: tự chọn gmail nếu có GMAIL_USER, brevo nếu có BREVO_API_KEY, còn lại console.
// =====================================================================

const provider = () => {
  const p = (process.env.MAIL_PROVIDER || "").toLowerCase();
  if (p) return p;
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) return "gmail";
  if (process.env.BREVO_API_KEY) return "brevo";
  return "console";
};

const fromAddress = () => process.env.MAIL_FROM || process.env.GMAIL_USER || "no-reply@roomie.local";
const fromName = () => process.env.MAIL_FROM_NAME || "Roomie";

let gmailTransport = null;
const getGmail = () => {
  if (!gmailTransport) {
    gmailTransport = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
  }
  return gmailTransport;
};

export async function sendMail({ to, subject, html, text }) {
  const p = provider();

  if (p === "gmail") {
    await getGmail().sendMail({ from: `"${fromName()}" <${fromAddress()}>`, to, subject, html, text });
    return;
  }

  if (p === "brevo") {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": process.env.BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { email: fromAddress(), name: fromName() },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
    });
    if (!res.ok) throw new Error(`Brevo trả lỗi ${res.status}: ${await res.text()}`);
    return;
  }

  // console: chỉ dùng khi phát triển, không bao giờ gửi thật
  if (process.env.NODE_ENV === "production") {
    throw new Error("Chưa cấu hình dịch vụ gửi email (MAIL_PROVIDER)");
  }
  console.log(`\n[MAIL — chưa cấu hình gửi thật] Tới: ${to}\nTiêu đề: ${subject}\n${text}\n`);
}

// Email chứa mã OTP, giao diện đơn giản đọc tốt trên Gmail điện thoại
export function otpEmail({ code, purpose }) {
  const title = purpose === "register" ? "Xác thực email đăng ký Roomie" : "Đặt lại mật khẩu Roomie";
  const lead = purpose === "register"
    ? "Cảm ơn bạn đã đăng ký Roomie. Nhập mã dưới đây để kích hoạt tài khoản:"
    : "Bạn vừa yêu cầu đặt lại mật khẩu. Nhập mã dưới đây để tạo mật khẩu mới:";
  const text = `${title}\n\n${lead}\n\n${code}\n\nMã có hiệu lực trong 10 phút. Nếu không phải bạn, hãy bỏ qua email này.`;
  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1e293b">
    <h2 style="margin:0 0 8px;color:#4677d6">Roomie</h2>
    <p style="margin:0 0 16px;font-size:15px">${lead}</p>
    <p style="margin:0 0 16px;font-size:32px;font-weight:700;letter-spacing:8px;background:#e8f2ff;border-radius:12px;padding:16px;text-align:center">${code}</p>
    <p style="margin:0;font-size:13px;color:#64748b">Mã có hiệu lực trong 10 phút. Nếu không phải bạn yêu cầu, hãy bỏ qua email này — tài khoản của bạn vẫn an toàn.</p>
  </div>`;
  return { subject: `${code} là mã ${purpose === "register" ? "xác thực" : "đặt lại mật khẩu"} Roomie`, html, text };
}
