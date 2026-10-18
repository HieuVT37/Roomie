import api from "./axios";

const d = (r) => r.data;

export const listPassApi = (params) => api.get("/pass", { params }).then(d);
export const getPassApi = (id) => api.get(`/pass/${id}`).then(d);
export const myPassApi = () => api.get("/pass/mine").then(d);
export const createPassApi = (data) => api.post("/pass", data).then(d);
export const updatePassApi = (id, data) => api.put(`/pass/${id}`, data).then(d);
export const setPassStatusApi = (id, status) => api.patch(`/pass/${id}/status`, { status }).then(d);
export const deletePassApi = (id) => api.delete(`/pass/${id}`).then(d);