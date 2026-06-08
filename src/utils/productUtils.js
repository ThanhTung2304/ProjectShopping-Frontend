export const getResponseList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.content)) return response.data.content;
  if (Array.isArray(response?.content)) return response.content;
  return [];
};

export const getResponseItem = (response) => {
  if (!response) return null;
  if (response.data && !Array.isArray(response.data)) return response.data;
  return response;
};

export const getProductId = (product) => product?.id || product?._id || product?.slug;

export const getProductPathId = (product) => product?.slug || product?.id || product?._id;

export const getProductImage = (product, fallback = "https://via.placeholder.com/300x400?text=No+Image") =>
  product?.img || product?.image || product?.thumbnail || product?.images?.[0] || fallback;

export const getProductPrice = (product) =>
  Number(product?.price ?? product?.minPrice ?? product?.maxPrice ?? 0);

export const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));
