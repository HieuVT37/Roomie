import api from "./axios";

const d = (r) => r.data;

export const getPlansApi = () => api.get("/billing/plans").then(d);
export const myBillingApi = () => api.get("/billing/me").then(d);
export const checkoutApi = (planCode, method) => api.post("/billing/checkout", { planCode, method }).then(d);
export const simulatePaymentApi = (paymentId, result) =>
  api.post(`/billing/payments/${paymentId}/simulate`, { result }).then(d);