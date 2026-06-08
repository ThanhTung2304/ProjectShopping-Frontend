import axiosClient from "./axiosClient";

const orderApi = {
  create: (data) => axiosClient.post("/api/orders", data),

  // Customer/Admin - old routes
  getAll: () => axiosClient.get("/api/orders"),
  getById: (id) => axiosClient.get(`/api/orders/${id}`),
  cancelOrder: (id) => axiosClient.patch(`/api/orders/${id}/cancel`),

  // Current user - new routes
  getMine: () => axiosClient.get("/api/me/orders"),
  getMineById: (id) => axiosClient.get(`/api/me/orders/${id}`),
  cancelMine: (id) => axiosClient.patch(`/api/me/orders/${id}/status`),

  // Admin - new routes
  adminGetAll: () => axiosClient.get("/api/admin/orders"),
  adminUpdateStatus: (id, status) => axiosClient.patch(`/api/admin/orders/${id}/status`, { status }),

  // Admin - old route aliases
  adminGetAllLegacy: () => axiosClient.get("/api/orders/admin"),
  adminUpdateStatusLegacy: (id, status) => axiosClient.patch(`/api/orders/admin/${id}/status`, { status }),
};

export default orderApi;
