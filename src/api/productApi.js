import axiosClient from "./axiosClient";

const productApi = {
  // Lấy tất cả sản phẩm, có thể truyền params để lọc/sắp xếp
  getAll: (params) => axiosClient.get("/api/products", { params }), 

  // Chi tiết theo slug
  getBySlug: (slug) => axiosClient.get(`/api/products/${slug}`),

  // Chi tiết theo id
  getById: (id) => axiosClient.get(`/api/products/id/${id}`),

  // Admin methods
  create: (data) => axiosClient.post("/api/products", data),
  update: (id, data) => axiosClient.put(`/api/products/${id}`, data),
  delete: (id) => axiosClient.delete(`/api/products/${id}`),

  // Variants
  addVariant: (id, data) => axiosClient.post(`/api/products/${id}/variants`, data),
  updateVariant: (variantId, data) => axiosClient.put(`/api/products/variants/${variantId}`, data),
  deleteVariant: (variantId) => axiosClient.delete(`/api/products/variants/${variantId}`),
};

export default productApi;