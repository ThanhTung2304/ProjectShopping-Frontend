import axiosClient from "./axiosClient";

const getResponseList = (response) => {
  if (Array.isArray(response)) return response;

  if (Array.isArray(response?.data?.data?.content))
    return response.data.data.content;

  if (Array.isArray(response?.data?.content))
    return response.data.content;

  if (Array.isArray(response?.data))
    return response.data;

  if (Array.isArray(response?.content))
    return response.content;

  return [];
};

const getTotalPages = (response) =>
  Number(
    response?.totalPages ??
    response?.data?.totalPages ??
    response?.page?.totalPages ??
    response?.data?.page?.totalPages ??
    response?.data?.data?.page?.totalPages ??
    response?.data?.data?.totalPages ??
    1
  );

const getProductKey = (product) => product?.id || product?._id || product?.slug || product?.name;

const productApi = {
  getAll: (params) => axiosClient.get("/api/products", { params }),

  getFeatured: () => axiosClient.get("/api/products/featured"),

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

  getBySlug: (slug) => axiosClient.get(`/api/products/${slug}`),

  getById: (id) => axiosClient.get(`/api/products/id/${id}`),

  getVariants: (productId) =>
    axiosClient.get(`/api/products/${productId}/variants`),

  getVariantsById: (productId) =>
    axiosClient.get(`/api/products/id/${productId}/variants`),

  create: (data) => axiosClient.post("/api/products", data),

  update: (id, data) => axiosClient.put(`/api/products/${id}`, data),

  toggleFeatured: (id, featured) =>
    axiosClient.patch(`/api/products/${id}/featured?featured=${featured}`),

  delete: (id) => axiosClient.delete(`/api/products/${id}`),

  uploadImage: (productId, { file, isPrimary = false, sortOrder = 0 }) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("isPrimary", String(Boolean(isPrimary)));
    formData.append("sortOrder", String(Number(sortOrder || 0)));

    return axiosClient.post(`/api/admin/products/${productId}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getImages: (productId) =>
    axiosClient.get(`/api/admin/products/${productId}/images`),

  setPrimaryImage: (productId, imageId) =>
    axiosClient.put(`/api/admin/products/${productId}/images/${imageId}/primary`),

  deleteImage: (productId, imageId) =>
    axiosClient.delete(`/api/admin/products/${productId}/images/${imageId}`),

  addVariant: (productId, data) =>
    axiosClient.post(`/api/products/id/${productId}/variants`, data),

  updateVariant: (variantId, data) =>
    axiosClient.put(`/api/products/variants/${variantId}`, data),

  deleteVariant: (variantId) =>
    axiosClient.delete(`/api/products/variants/${variantId}`),
};

export default productApi;