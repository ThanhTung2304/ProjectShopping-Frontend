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

export const resolveImageUrl = (value) => {
  if (!value) return "";
  if (/^(https?:|data:|blob:)/i.test(value)) return value;

  const apiBaseUrl = import.meta.env.VITE_API_URL || "";
  if (!apiBaseUrl || !value.startsWith("/")) return value;

  return `${apiBaseUrl.replace(/\/$/, "")}${value}`;
};

const getImageValue = (image) => {
  if (!image) return "";
  if (typeof image === "string") return resolveImageUrl(image);
  return resolveImageUrl(
    image.url ||
      image.imageUrl ||
      image.image_url ||
      image.productImage ||
      image.productImageUrl ||
      image.thumbnailUrl ||
      image.imagePath ||
      image.src ||
      image.path ||
      "",
  );
};

const sortImages = (images = []) =>
  [...images].sort((first, second) => {
    const firstPrimary = first?.isPrimary ?? first?.is_primary ?? false;
    const secondPrimary = second?.isPrimary ?? second?.is_primary ?? false;

    if (firstPrimary !== secondPrimary) return firstPrimary ? -1 : 1;

    return Number(first?.sortOrder ?? first?.sort_order ?? 0) - Number(second?.sortOrder ?? second?.sort_order ?? 0);
  });

export const getProductImage = (product, fallback = FALLBACK_PRODUCT_IMAGE) => {
  const images = [
    product?.img,
    product?.image,
    product?.imageUrl,
    product?.image_url,
    product?.productImage,
    product?.productImageUrl,
    product?.thumbnail,
    product?.thumbnailUrl,
    product?.imagePath,
    sortImages(product?.images || product?.productImages || product?.product_images || [])[0],
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

export const normalizeFilterValue = (value) => String(value ?? "").trim().toLowerCase();

export const getProductCategoryValues = (product) =>
  [
    product?.categoryId,
    product?.category_id,
    product?.category?.id,
    product?.category?._id,
    product?.category?.slug,
    product?.category?.name,
    product?.categoryName,
  ]
    .filter((value) => value !== undefined && value !== null && value !== "")
    .map(normalizeFilterValue);

export const matchesProductCategory = (product, categoryValue) => {
  if (!categoryValue || categoryValue === "all") return true;

  return getProductCategoryValues(product).includes(normalizeFilterValue(categoryValue));
};

export const sortProductList = (items, sort) => {
  const sortedItems = [...items];

  if (sort === "price_asc") {
    return sortedItems.sort((first, second) => getProductPrice(first) - getProductPrice(second));
  }

  if (sort === "price_desc") {
    return sortedItems.sort((first, second) => getProductPrice(second) - getProductPrice(first));
  }

  return sortedItems;
};
