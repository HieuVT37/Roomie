import api from "./axios";

const d = (r) => r.data;

export const listAccommodationsApi = (params) => api.get("/accommodations", { params }).then(d);
export const accommodationMetaApi = () => api.get("/accommodations/meta").then(d);
export const getAccommodationApi = (id) => api.get(`/accommodations/${id}`).then(d);
export const myAccommodationsApi = () => api.get("/accommodations/mine").then(d);
export const createAccommodationApi = (data) => api.post("/accommodations", data).then(d);
export const updateAccommodationApi = (id, data) => api.put(`/accommodations/${id}`, data).then(d);
export const setAccommodationStatusApi = (id, status) =>
  api.patch(`/accommodations/${id}/status`, { status }).then(d);
export const deleteAccommodationApi = (id) => api.delete(`/accommodations/${id}`).then(d);