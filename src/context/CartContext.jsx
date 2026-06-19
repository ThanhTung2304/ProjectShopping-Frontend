import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import cartApi from "../api/cartApi";
import productApi from "../api/productApi";
import { AuthContext } from "./authContextValue";
import { CartContext } from "./cartContextValue";
import { getProductImage, getResponseItem, resolveImageUrl } from "../utils/productUtils";

const LOCAL_CART_KEY = "fashion_shop_local_cart";

const getLocalCart = () => {
  try {
    const items = JSON.parse(localStorage.getItem(LOCAL_CART_KEY) || "[]");
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
};

const saveLocalCart = (items) => {
  localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items));
};

const getCartItemImage = (item, product) => {
  const directImage = item.image || item.img || item.imageUrl;
  if (directImage) {
    return resolveImageUrl(
      typeof directImage === "string" ? directImage : getProductImage({ images: [directImage] }),
    );
  }
  return getProductImage(product);
};

const FALLBACK_CART_IMAGE_PREFIX = "data:image/svg+xml";

// ✅ Sửa: thêm item.unitPrice và item.productName
const normalizeCartItem = (item) => {
  const product = item.product || item.productId || {};
  const variant = item.variant || item.productVariant || item.productVariantId || {};
  const id = item.id || item._id || item.cartItemId || product.id || product._id || item.productId;
  const productId =
    item.productId && typeof item.productId !== "object"
      ? item.productId
      : product.id || product._id || item.product || id;
  const productVariantId =
    item.productVariantId && typeof item.productVariantId !== "object"
      ? item.productVariantId
      : item.variantId || variant.id || variant._id;

  return {
    ...item,
    id,
    productId,
    productVariantId,
    variantId: item.variantId || productVariantId,
    isLocal: Boolean(item.isLocal),
    // ✅ Thêm item.productName (field từ server)
    name: item.name || item.productName || product.name || "Sản phẩm",
    // ✅ Thêm item.unitPrice (field từ server)
    price: Number(
      item.price ??
        item.unitPrice ??
        variant.salePrice ??
        variant.sale_price ??
        variant.price ??
        product.price ??
        product.minPrice ??
        product.maxPrice ??
        0,
    ),
    quantity: Number(item.quantity ?? 1),
    image: getCartItemImage(item, product),
  };
};

const hydrateCartItemImage = async (item) => {
  if (item.image && !item.image.startsWith(FALLBACK_CART_IMAGE_PREFIX)) return item;
  if (!item.productId) return item;

  try {
    const product = getResponseItem(await productApi.getById(item.productId));
    return product
      ? { ...item, image: getProductImage(product), product: { ...item.product, ...product } }
      : item;
  } catch {
    return item;
  }
};

const mergeCartItems = (serverItems, localItems) => {
  const merged = [...serverItems];

  localItems.forEach((localItem) => {
    const existingIndex = merged.findIndex(
      (item) =>
        String(item.productVariantId || item.productId || item.id) ===
        String(localItem.productVariantId || localItem.productId || localItem.id),
    );

    if (existingIndex >= 0) {
      merged[existingIndex] = {
        ...merged[existingIndex],
        quantity: Number(merged[existingIndex].quantity || 0) + Number(localItem.quantity || 0),
      };
      return;
    }

    merged.push(localItem);
  });

  return merged;
};

const upsertLocalCartItem = (items, productId, quantity, productSnapshot, variantSnapshot) => {
  const variantId =
    variantSnapshot?.id ||
    variantSnapshot?._id ||
    productSnapshot?.productVariantId ||
    productSnapshot?.variantId;
  const normalizedItemId = String(variantId || productId);
  const existingIndex = items.findIndex(
    (item) =>
      String(item.productVariantId || item.productId || item.id) === normalizedItemId,
  );

  if (existingIndex >= 0) {
    return items.map((item, index) =>
      index === existingIndex
        ? { ...item, quantity: Number(item.quantity || 0) + Number(quantity || 1) }
        : item,
    );
  }

  return [
    ...items,
    normalizeCartItem({
      id: `local-${productId}`,
      productId,
      productVariantId: variantId,
      variantId,
      quantity,
      isLocal: true,
      product: productSnapshot,
      variant: variantSnapshot,
      name: productSnapshot?.name,
      price:
        variantSnapshot?.salePrice ??
        variantSnapshot?.sale_price ??
        variantSnapshot?.price ??
        productSnapshot?.price ??
        productSnapshot?.minPrice ??
        productSnapshot?.maxPrice,
      image:
        productSnapshot?.image ||
        productSnapshot?.img ||
        productSnapshot?.thumbnail ||
        productSnapshot?.images?.[0],
    }),
  ];
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => getLocalCart().map(normalizeCartItem));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useContext(AuthContext);

  const setLocalCartItems = (updater) => {
    const nextLocalItems =
      typeof updater === "function" ? updater(getLocalCart().map(normalizeCartItem)) : updater;
    saveLocalCart(nextLocalItems);
    setCartItems((items) =>
      mergeCartItems(items.filter((item) => !item.isLocal), nextLocalItems),
    );
    return nextLocalItems;
  };

  const fetchCart = useCallback(
    async ({ keepCurrentOnEmpty = false } = {}) => {
      const localItems = await Promise.all(
        getLocalCart().map(normalizeCartItem).map(hydrateCartItemImage),
      );

      if (!user) {
        setCartItems(localItems);
        setError("");
        return localItems;
      }

      setLoading(true);
      setError("");

      try {
        const res = await cartApi.getCart();
        if (res.success) {
          const items = res.data?.items || res.data || [];
          const normalizedItems = Array.isArray(items)
            ? await Promise.all(items.map(normalizeCartItem).map(hydrateCartItemImage))
            : [];

          // ✅ Server items đã có đủ data — không merge với local nữa khi đã login
          const mergedItems = mergeCartItems(normalizedItems, localItems);

          if (mergedItems.length > 0 || !keepCurrentOnEmpty) {
            setCartItems(mergedItems);
          }

          // ✅ Xóa local cart sau khi sync thành công với server
          if (normalizedItems.length > 0 && localItems.length > 0) {
            saveLocalCart([]);
          }

          return mergedItems;
        }
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          setCartItems(localItems);
          setError("");
          return localItems;
        }

        setCartItems((items) =>
          mergeCartItems(items.filter((item) => !item.isLocal), localItems),
        );
        setError(
          "Không thể đồng bộ giỏ hàng với máy chủ. Giỏ hàng tạm vẫn được lưu trên trình duyệt.",
        );
        console.error("Lỗi lấy giỏ hàng:", err);
      } finally {
        setLoading(false);
      }

      return localItems;
    },
    [user],
  );

  useEffect(() => {
    void fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, quantity, productSnapshot, variantSnapshot) => {
    const variantId =
      variantSnapshot?.id ||
      variantSnapshot?._id ||
      productSnapshot?.productVariantId ||
      productSnapshot?.variantId;
    const payload = variantId ? { variantId, quantity } : { productId, quantity };

    try {
      const res = await cartApi.addToCart(payload);
      const didAdd = res?.success !== false;

      if (didAdd) {
        await fetchCart({ keepCurrentOnEmpty: true });
      }

      return res;
    } catch (err) {
      if (err.response?.status === 400) {
        setLocalCartItems((items) =>
          upsertLocalCartItem(items, productId, quantity, productSnapshot, variantSnapshot),
        );
        return {
          success: true,
          localOnly: true,
          message: "Sản phẩm đã được lưu tạm trên trình duyệt.",
        };
      }

      throw err;
    }
  };

  const updateQuantity = async (cartItemId, quantity) => {
    if (quantity < 1) {
      return removeItem(cartItemId);
    }

    const targetItem = cartItems.find((item) => String(item.id) === String(cartItemId));
    if (targetItem?.isLocal) {
      setLocalCartItems((items) =>
        items.map((item) =>
          String(item.id) === String(cartItemId) ? { ...item, quantity } : item,
        ),
      );
      return { success: true, localOnly: true };
    }

    const res = await cartApi.updateQuantity(cartItemId, quantity);
    if (res.success) await fetchCart();
    return res;
  };

  const removeItem = async (cartItemId) => {
    const targetItem = cartItems.find((item) => String(item.id) === String(cartItemId));
    if (targetItem?.isLocal) {
      setLocalCartItems((items) =>
        items.filter((item) => String(item.id) !== String(cartItemId)),
      );
      return { success: true, localOnly: true };
    }

    const res = await cartApi.removeItem(cartItemId);
    if (res.success) await fetchCart();
    return res;
  };

  const clearCart = async () => {
    saveLocalCart([]);
    const res = await cartApi.clearCart();
    if (res.success) await fetchCart();
    return res;
  };

  const subtotal = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cartItems],
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        error,
        fetchCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};