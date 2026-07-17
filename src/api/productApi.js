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

const getProductKey = (product) => product?.id || product?._id || product?.slug || product?.name;

const productApi = {
  // ===== PUBLIC PRODUCT =====

  // GET /api/products
  getAll: (params) => axiosClient.get("/api/products", { params }),

  // API phân trang mặc định, nên lấy tất cả các trang cho các màn hình danh sách.
  getAllPages: async (params = {}) => {
    const defaultResponse = await axiosClient.get("/api/products", { params });
    const defaultProducts = getResponseList(defaultResponse);

    try {
      const totalPages = getTotalPages(defaultResponse);
      const responses = totalPages > 1
        ? await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, index) =>
              axiosClient.get("/api/products", { params: { ...params, page: index + 1 } }),
            ),
          )
        : [];

      const seen = new Set();
      return [defaultResponse, ...responses].flatMap(getResponseList).filter((product) => {
        const key = String(getProductKey(product) || "");
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    } catch {
      return defaultProducts;
    }
  },

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
