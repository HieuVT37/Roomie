import api from "./axios";

export const notificationsApi = () => api.get("/notifications").then((r) => r.data);
