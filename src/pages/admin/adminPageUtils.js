import { formatCurrency, getProductPrice, getResponseList } from "../../utils/productUtils";
import { isAdminRole, isAdminUser, normalizeRole } from "../../utils/authUtils";

export const getList = getResponseList;

export const getId = (item) => item?.id || item?._id || item?.slug;

export const formatMoney = (value) => formatCurrency(value);

export const getProductDisplayPrice = (product) => formatCurrency(getProductPrice(product));

export { isAdminRole, isAdminUser, normalizeRole };

export const safeText = (value, fallback = "Chưa có") => value || fallback;
