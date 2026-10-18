import api from "./axios";

const d = (r) => r.data;

export const sendRequestApi = (receiverId, message) =>
  api.post("/connections", { receiverId, message: message || null }).then(d);
export const listConnectionsApi = (type) => api.get("/connections", { params: { type } }).then(d);
export const markSeenApi = (type) => api.post("/connections/seen", { type }).then(d);
export const connectionSummaryApi = () => api.get("/connections/summary").then(d);
export const acceptApi = (id) => api.patch(`/connections/${id}/accept`).then(d);
export const rejectApi = (id) => api.patch(`/connections/${id}/reject`).then(d);
export const cancelApi = (id) => api.patch(`/connections/${id}/cancel`).then(d);
export const disconnectApi = (id) => api.delete(`/connections/${id}`).then(d);
export const blockApi = (userId) => api.post(`/connections/block/${userId}`).then(d);
export const unblockApi = (userId) => api.delete(`/connections/block/${userId}`).then(d);