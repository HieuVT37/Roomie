import api from "./axios";

export const listMatchesApi = (params) => api.get("/matching", { params }).then((r) => r.data);
export const getMatchApi = (userId) => api.get(`/matching/${userId}`).then((r) => r.data);
// Nhận xét AI: GET chỉ đọc bản đã lưu + số lượt; POST mới gọi AI (trừ 1 lượt theo gói)
export const getMatchInsightApi = (userId) => api.get(`/matching/${userId}/insight`).then((r) => r.data);
export const createMatchInsightApi = (userId) => api.post(`/matching/${userId}/insight`).then((r) => r.data);
