import api from "./axios";

export const getMyProfileApi = () => api.get("/profiles/me").then((r) => r.data);
export const updateMyProfileApi = (data) => api.put("/profiles/me", data).then((r) => r.data);