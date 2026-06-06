import axiosClient from "./axiosClient";

const couponApi = {
  apply: (code) => axiosClient.post("/api/coupons/apply", { code }),
  // Admin
  create: (data) => axiosClient.post("/api/coupons", data),
  update: (id, data) => axiosClient.put(`/api/coupons/${id}`, data),
  delete: (id) => axiosClient.delete(`/api/coupons/${id}`),
};

export default couponApi;