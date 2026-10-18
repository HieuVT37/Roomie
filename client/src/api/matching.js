import api from "./axios";

export const listMatchesApi = (params) => api.get("/matching", { params }).then((r) => r.data);
export const getMatchApi = (userId) => api.get(`/matching/${userId}`).then((r) => r.data);