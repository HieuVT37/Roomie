import api from "./axios";

export const listFaqsApi = () => api.get("/support/faqs").then((r) => r.data);
export const createReportApi = (data) => api.post("/support/reports", data).then((r) => r.data);