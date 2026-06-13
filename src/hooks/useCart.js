import { useContext, useMemo, useState } from "react";
import { CartContext } from "../context/cartContextValue";

export function useCart() {
  const context = useContext(CartContext);
  const [submittingItemId, setSubmittingItemId] = useState(null);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  const itemCount = useMemo(
    () => context.cartItems.reduce((total, item) => total + Number(item.quantity || 0), 0),
    [context.cartItems],
  );

  const isEmpty = context.cartItems.length === 0;

  const addItem = async (productId, quantity = 1, productSnapshot, variantSnapshot) => {
    setSubmittingItemId(productId);
    try {
      return await context.addToCart(productId, quantity, productSnapshot, variantSnapshot);
    } finally {
      setSubmittingItemId(null);
    }
  };

  const changeQuantity = async (cartItemId, quantity) => {
    setSubmittingItemId(cartItemId);
    try {
      return await context.updateQuantity(cartItemId, quantity);
    } finally {
      setSubmittingItemId(null);
    }
  };

  const removeItem = async (cartItemId) => {
    setSubmittingItemId(cartItemId);
    try {
      return await context.removeItem(cartItemId);
    } finally {
      setSubmittingItemId(null);
    }
  };

  const clearItems = async () => {
    setSubmittingItemId("all");
    try {
      return await context.clearCart();
    } finally {
      setSubmittingItemId(null);
    }
  };

  return {
    ...context,
    itemCount,
    isEmpty,
    submittingItemId,
    addItem,
    changeQuantity,
    removeItem,
    clearItems,
  };
}

export default useCart;
