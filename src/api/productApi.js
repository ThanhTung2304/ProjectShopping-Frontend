import axiosClient from "./axiosClient";

const productApi = {
  // ===== PUBLIC PRODUCT =====

  // GET /api/products
  getAll: (params) => axiosClient.get("/api/products", { params }),

  // GET /api/products/{slug}
  getBySlug: (slug) => axiosClient.get(`/api/products/${slug}`),

  // GET /api/products/id/{id}
  getById: (id) => axiosClient.get(`/api/products/id/${id}`),

  // GET /api/products/{productId}/variants (dùng slug hoặc id dạng số)
  getVariants: (productId) =>
    axiosClient.get(`/api/products/${productId}/variants`),

  // GET /api/products/id/{productId}/variants
  getVariantsById: (productId) =>
    axiosClient.get(`/api/products/id/${productId}/variants`),

  // ===== ADMIN PRODUCT =====
  // Đúng path: /api/products (không phải /api/admin/products)

  // POST /api/products
  create: (data) => axiosClient.post("/api/products", data),

  // PUT /api/products/{id}
  update: (id, data) => axiosClient.put(`/api/products/${id}`, data),

  // DELETE /api/products/{id}
  delete: (id) => axiosClient.delete(`/api/products/${id}`),

  // ===== ADMIN PRODUCT IMAGE =====
  // Đúng path: /api/admin/products (AdminProductController dùng prefix này)

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
  getImages: (productId) =>
    axiosClient.get(`/api/admin/products/${productId}/images`),

  // PUT /api/admin/products/{productId}/images/{imageId}/primary
  setPrimaryImage: (productId, imageId) =>
    axiosClient.put(`/api/admin/products/${productId}/images/${imageId}/primary`),

  // DELETE /api/admin/products/{productId}/images/{imageId}
  deleteImage: (productId, imageId) =>
    axiosClient.delete(`/api/admin/products/${productId}/images/${imageId}`),

  // ===== ADMIN VARIANT =====

  // POST /api/products/id/{productId}/variants
  addVariant: (productId, data) =>
    axiosClient.post(`/api/products/id/${productId}/variants`, data),

  // PUT /api/products/variants/{variantId}
  updateVariant: (variantId, data) =>
    axiosClient.put(`/api/products/variants/${variantId}`, data),

  // DELETE /api/products/variants/{variantId}
  deleteVariant: (variantId) =>
    axiosClient.delete(`/api/products/variants/${variantId}`),
};

export default productApi;