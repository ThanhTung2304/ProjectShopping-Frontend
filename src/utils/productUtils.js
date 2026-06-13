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

export const FALLBACK_PRODUCT_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='720' height='960' viewBox='0 0 720 960'%3E%3Crect width='720' height='960' fill='%23f5f5f5'/%3E%3Ctext x='360' y='480' text-anchor='middle' fill='%23999' font-family='Arial' font-size='32'%3ENo Image%3C/text%3E%3C/svg%3E";

const getImageValue = (image) => {
  if (!image) return "";
  if (typeof image === "string") return image;
  return image.url || image.imageUrl || image.image_url || image.src || image.path || "";
};

export const getProductImage = (product, fallback = FALLBACK_PRODUCT_IMAGE) => {
  const images = [
    product?.img,
    product?.image,
    product?.thumbnail,
    product?.images?.[0],
    product?.gallery?.[0],
  ]
    .map(getImageValue)
    .filter(Boolean);

  return images[0] || fallback;
};

export const getProductPrice = (product) =>
  Number(product?.price ?? product?.minPrice ?? product?.maxPrice ?? 0);

export const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));
