import api from "./axios";

const d = (r) => r.data;

export const adminStatsApi = () => api.get("/admin/stats").then(d);

export const adminUsersApi = (params) => api.get("/admin/users", { params }).then(d);
export const adminUpdateUserApi = (id, data) => api.patch(`/admin/users/${id}`, data).then(d);
export const adminGrantPlanApi = (id, planCode, days) => api.post(`/admin/users/${id}/plan`, { planCode, days }).then(d);

export const adminListingsApi = (params) => api.get("/admin/listings", { params }).then(d);
export const adminModerateApi = (kind, id, status, note) =>
  api.patch(`/admin/listings/${kind}/${id}/moderation`, { status, note }).then(d);

export const adminDeleteListingApi = (kind, id) => api.delete(`/admin/listings/${kind}/${id}`).then(d);

export const adminReportsApi = (params) => api.get("/admin/reports", { params }).then(d);
export const adminHandleReportApi = (id, data) => api.patch(`/admin/reports/${id}`, data).then(d);

export const adminPlansApi = () => api.get("/admin/plans").then(d);
export const adminUpdatePlanApi = (code, data) => api.patch(`/admin/plans/${code}`, data).then(d);

export const adminFaqsApi = () => api.get("/admin/faqs").then(d);
export const adminCreateFaqApi = (data) => api.post("/admin/faqs", data).then(d);
export const adminUpdateFaqApi = (id, data) => api.put(`/admin/faqs/${id}`, data).then(d);
export const adminDeleteFaqApi = (id) => api.delete(`/admin/faqs/${id}`).then(d);