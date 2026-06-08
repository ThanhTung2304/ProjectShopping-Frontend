import axiosClient from "./axiosClient";

const couponApi = {
  apply: (code) => axiosClient.post("/api/coupons/apply", { code }),

  // Admin - new routes
  create: (data) => axiosClient.post("/api/admin/coupons", data),
  update: (id, data) => axiosClient.put(`/api/admin/coupons/${id}`, data),
  delete: (id) => axiosClient.delete(`/api/admin/coupons/${id}`),

  // Admin - old route aliases
  createLegacy: (data) => axiosClient.post("/api/coupons", data),
  updateLegacy: (id, data) => axiosClient.put(`/api/coupons/${id}`, data),
  deleteLegacy: (id) => axiosClient.delete(`/api/coupons/${id}`),
};

export default couponApi;
