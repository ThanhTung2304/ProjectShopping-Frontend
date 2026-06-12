import axiosClient from "./axiosClient";

const productApi = {
  // ===== PUBLIC PRODUCT =====

  // GET /api/products
  getAll: (params) => axiosClient.get("/api/products", { params }),

  // GET /api/products/{slug}
  getBySlug: (slug) => axiosClient.get(`/api/products/${slug}`),

  // GET /api/products/id/{id}
  getById: (id) => axiosClient.get(`/api/products/id/${id}`),

  // GET /api/products/{productId}/variants
  getVariants: (productId) =>
    axiosClient.get(`/api/products/${productId}/variants`),

  // Nếu backend chưa có API này thì có thể bỏ
  getAllVariants: (params) =>
    axiosClient.get("/api/product-variants", { params }),

  // ===== ADMIN PRODUCT =====
  // Backend của bạn vẫn dùng /api/products
  // Phân quyền admin nằm ở @PreAuthorize("hasRole('ADMIN')")

  // POST /api/products
  create: (data) => axiosClient.post("/api/products", data),

  // PUT /api/products/{id}
  update: (id, data) => axiosClient.put(`/api/products/${id}`, data),

  // DELETE /api/products/{id}
  delete: (id) => axiosClient.delete(`/api/products/${id}`),

  // ===== ADMIN VARIANT =====

  // POST /api/products/{productId}/variants
  addVariant: (productId, data) =>
    axiosClient.post(`/api/products/${productId}/variants`, data),

  // PUT /api/products/variants/{variantId}
  updateVariant: (variantId, data) =>
    axiosClient.put(`/api/products/variants/${variantId}`, data),

  // DELETE /api/products/variants/{variantId}
  deleteVariant: (variantId) =>
    axiosClient.delete(`/api/products/variants/${variantId}`),
};

export default productApi;