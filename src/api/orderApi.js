import axiosClient from "./axiosClient";

const getResponseList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.content)) return response.data.content;
  if (Array.isArray(response?.content)) return response.content;
  return [];
};

const getTotalPages = (response) =>
  Number(response?.totalPages ?? response?.data?.totalPages ?? response?.page?.totalPages ?? response?.data?.page?.totalPages ?? 1);

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
  adminGetAllOrderPages: async (params = {}) => {
    const firstResponse = await axiosClient.get("/api/admin/orders", { params });

    try {
      const totalPages = getTotalPages(firstResponse);
      const responses = totalPages > 1
        ? await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, index) =>
              axiosClient.get("/api/admin/orders", { params: { ...params, page: index + 1 } }),
            ),
          )
        : [];

      return [firstResponse, ...responses].flatMap(getResponseList);
    } catch {
      return getResponseList(firstResponse);
    }
  },
  adminGetOrderDetail: (id) => axiosClient.get(`/api/admin/orders/${id}`),
  adminUpdateStatus: (id, status) =>
    axiosClient.patch(`/api/admin/orders/${id}/status`, { status }),
};

export default orderApi;
