import axiosClient from "./axiosClient";

const orderApi = {
  // Đặt hàng
  create: (data) => axiosClient.post("/api/orders", data),

  // Customer - dùng /api/me/orders
  getMyOrders: (params) => axiosClient.get("/api/me/orders", { params }),
  getOrderDetail: (id) => axiosClient.get(`/api/me/orders/${id}`),
  cancelOrder: (id) => axiosClient.patch(`/api/me/orders/${id}/cancel`),
  confirmReceived: (id) => axiosClient.patch(`/api/me/orders/${id}/received`),

  // Admin
  adminGetAllOrders: (params) => axiosClient.get("/api/admin/orders", { params }),
  adminGetOrderDetail: (id) => axiosClient.get(`/api/admin/orders/${id}`),
  adminUpdateStatus: (id, status) =>
    axiosClient.patch(`/api/admin/orders/${id}/status`, { status }),
};

export default orderApi;