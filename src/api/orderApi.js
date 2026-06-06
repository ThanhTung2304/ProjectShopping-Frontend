import axiosClient from "./axiosClient";

const orderApi = {
  create: (data) => axiosClient.post("/api/orders", data),
  getAll: () => axiosClient.get("/api/orders"),
  getById: (id) => axiosClient.get(`/api/orders/${id}`),
  cancelOrder: (id) => axiosClient.patch(`/api/orders/${id}/cancel`),

  // Admin
  adminGetAll: () => axiosClient.get("/api/orders/admin"),
  adminUpdateStatus: (id, status) => axiosClient.patch(`/api/orders/admin/${id}/status`, { status }),
};

export default orderApi;