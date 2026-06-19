import { formatCurrency, getProductPrice, getResponseItem, getResponseList } from "../../utils/productUtils";
import { isAdminRole, isAdminUser, normalizeRole } from "../../utils/authUtils";

export const getList = getResponseList;
export const getItem = getResponseItem;

export const getId = (item) =>
  item?.id || item?._id || item?.productId || item?.product_id || item?.couponId || item?.coupon_id || item?.slug;

export const formatMoney = (value) => formatCurrency(value);

export const LOW_STOCK_THRESHOLD = 20;

export const getVariantPrice = (variant) =>
  Number(variant?.salePrice ?? variant?.sale_price ?? variant?.price ?? 0);

export const getVariantStock = (variant) =>
  Number(
    variant?.stockQuantity ??
      variant?.stock_quantity ??
      variant?.quantityInStock ??
      variant?.inventoryQuantity ??
      variant?.availableStock ??
      variant?.stock ??
      variant?.quantity ??
      0,
  );

export const isVariantActive = (variant) => variant?.isActive ?? variant?.is_active ?? variant?.active ?? true;

export const getProductVariants = (product) =>
  getResponseList(product?.variants)
    .concat(getResponseList(product?.productVariants))
    .concat(getResponseList(product?.product_variants));

export const getActiveVariants = (product) => getProductVariants(product).filter(isVariantActive);

export const getVariantProductId = (variant) => {
  if (variant?.productId && typeof variant.productId !== "object") return variant.productId;
  if (variant?.product_id) return variant.product_id;
  if (variant?.product?.id) return variant.product.id;
  if (variant?.product?._id) return variant.product._id;
  return null;
};

export const attachVariantsToProducts = (products, variants) => {
  if (!Array.isArray(products) || !Array.isArray(variants) || variants.length === 0) return products;

  return products.map((product) => ({
    ...product,
    variants: variants.filter((variant) => String(getVariantProductId(variant)) === String(getId(product))),
  }));
};

export const getProductDisplayPrice = (product) => {
  const variantPrices = getActiveVariants(product).map(getVariantPrice).filter((price) => price > 0);
  const minPrice = variantPrices.length ? Math.min(...variantPrices) : Number(product?.minPrice ?? product?.price ?? 0);
  const maxPrice = variantPrices.length ? Math.max(...variantPrices) : Number(product?.maxPrice ?? minPrice);

  if (minPrice > 0 && maxPrice > 0 && minPrice !== maxPrice) {
    return `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;
  }

  return formatCurrency(minPrice || getProductPrice(product));
};

export const getProductStock = (product) => {
  const variantStock = getActiveVariants(product).reduce((total, variant) => total + getVariantStock(variant), 0);
  const directStock =
    product?.totalStock ??
    product?.total_stock ??
    product?.stockQuantity ??
    product?.stock_quantity ??
    product?.quantityInStock ??
    product?.inventoryQuantity ??
    product?.availableStock ??
    product?.stock ??
    product?.quantity;

  if (directStock !== undefined && directStock !== null) {
    return Number(directStock);
  }

  if (getActiveVariants(product).length > 0) {
    return variantStock;
  }

  return null;
};

export const formatStock = (product) => {
  const stock = getProductStock(product);
  return stock === null ? "Không có dữ liệu" : stock;
};

export const isLowStock = (product) => {
  const stock = getProductStock(product);
  return stock !== null && stock < LOW_STOCK_THRESHOLD;
};

export { isAdminRole, isAdminUser, normalizeRole };

export const safeText = (value, fallback = "Chưa có") => value || fallback;
