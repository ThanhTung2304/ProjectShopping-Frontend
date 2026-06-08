import axiosClient from "./axiosClient";

const productApi = {
  getAll: (params) => axiosClient.get("/api/products", { params }),
  getBySlug: (slug) => axiosClient.get(`/api/products/${slug}`),
  getById: (id) => axiosClient.get(`/api/products/id/${id}`),

  // Admin - new routes
  adminGetById: (id) => axiosClient.get(`/api/admin/products/${id}`),
  create: (data) => axiosClient.post("/api/admin/products", data),
  update: (id, data) => axiosClient.put(`/api/admin/products/${id}`, data),
  delete: (id) => axiosClient.delete(`/api/admin/products/${id}`),
  addVariant: (productId, data) => axiosClient.post(`/api/admin/products/${productId}/variants`, data),
  updateVariant: (variantId, data) => axiosClient.put(`/api/admin/products/variants/${variantId}`, data),
  deleteVariant: (variantId) => axiosClient.delete(`/api/admin/products/variants/${variantId}`),

  // Admin - old route aliases
  createLegacy: (data) => axiosClient.post("/api/products", data),
  updateLegacy: (id, data) => axiosClient.put(`/api/products/${id}`, data),
  deleteLegacy: (id) => axiosClient.delete(`/api/products/${id}`),
  addVariantLegacy: (productId, data) => axiosClient.post(`/api/products/${productId}/variants`, data),
  updateVariantLegacy: (variantId, data) => axiosClient.put(`/api/products/variants/${variantId}`, data),
  deleteVariantLegacy: (variantId) => axiosClient.delete(`/api/products/variants/${variantId}`),
};

export default productApi;
