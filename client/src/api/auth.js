import api from "./axios";

export const registerApi = (data) => api.post("/auth/register", data).then((r) => r.data);
export const loginApi = (data) => api.post("/auth/login", data).then((r) => r.data);
export const logoutApi = () => api.post("/auth/logout").then((r) => r.data);
export const meApi = () => api.get("/auth/me").then((r) => r.data);