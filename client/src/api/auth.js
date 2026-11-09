import api from "./axios";

export const registerApi = (data) => api.post("/auth/register", data).then((r) => r.data);
export const loginApi = (data) => api.post("/auth/login", data).then((r) => r.data);
export const logoutApi = () => api.post("/auth/logout").then((r) => r.data);
export const meApi = () => api.get("/auth/me").then((r) => r.data);
// Xác thực email bằng mã OTP, quên / đặt lại / đổi mật khẩu
export const verifyEmailApi = (data) => api.post("/auth/verify-email", data).then((r) => r.data);
export const resendVerificationApi = (email) => api.post("/auth/resend-verification", { email }).then((r) => r.data);
export const forgotPasswordApi = (email) => api.post("/auth/forgot-password", { email }).then((r) => r.data);
export const resetPasswordApi = (data) => api.post("/auth/reset-password", data).then((r) => r.data);
export const changePasswordApi = (data) => api.post("/auth/change-password", data).then((r) => r.data);
