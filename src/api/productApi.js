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

  // GET /api/products/id/{productId}/variants
  getVariantsById: (productId) =>
    axiosClient.get(`/api/products/id/${productId}/variants`),

  // Nếu backend chưa có API này thì có thể bỏ
  getAllVariants: (params) =>
    axiosClient.get("/api/product-variants", { params }),

  // ===== ADMIN PRODUCT =====
  // Backend của bạn vẫn dùng /api/products
  // Phân quyền admin nằm ở @PreAuthorize("hasRole('ADMIN')")

  // POST /api/products
  create: (data) => axiosClient.post("/api/admin/products", data),

  // PUT /api/products/{id}
  update: (id, data) => axiosClient.put(`/api/admin/products/${id}`, data),

  // DELETE /api/products/{id}
  delete: (id) => axiosClient.delete(`/api/admin/products/${id}`),

  // ===== ADMIN PRODUCT IMAGE =====

  // POST /api/admin/products/{productId}/images
  uploadImage: (productId, { file, isPrimary = false, sortOrder = 0 }) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("isPrimary", String(Boolean(isPrimary)));
    formData.append("sortOrder", String(Number(sortOrder || 0)));

    return axiosClient.post(`/api/admin/products/${productId}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // GET /api/admin/products/{productId}/images
  getImages: (productId) => axiosClient.get(`/api/admin/products/${productId}/images`),

  // PUT /api/admin/products/{productId}/images/{imageId}/primary
  setPrimaryImage: (productId, imageId) =>
    axiosClient.put(`/api/admin/products/${productId}/images/${imageId}/primary`),

  // DELETE /api/admin/products/{productId}/images/{imageId}
  deleteImage: (productId, imageId) =>
    axiosClient.delete(`/api/admin/products/${productId}/images/${imageId}`),

  // ===== ADMIN VARIANT =====

  // POST /api/products/{productId}/variants
  addVariant: (productId, data) =>
    axiosClient.post(`/api/admin/products/id/${productId}/variants`, data),

  // PUT /api/products/variants/{variantId}
  updateVariant: (variantId, data) =>
    axiosClient.put(`/api/admin/products/variants/${variantId}`, data),

  // DELETE /api/products/variants/{variantId}
  deleteVariant: (variantId) =>
    axiosClient.delete(`/api/admin/products/variants/${variantId}`),
};

export default productApi;
