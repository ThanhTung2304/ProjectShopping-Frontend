import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import cartApi from '../api/cartApi';
import { AuthContext } from './authContextValue';
import { CartContext } from './cartContextValue';

const normalizeCartItem = (item) => {
  const product = item.product || item.productId || {};
  const id = item.id || item._id;
  const productId =
    item.productId && typeof item.productId !== 'object'
      ? item.productId
      : product.id || product._id || item.product;

  return {
    ...item,
    id,
    productId,
    name: item.name || product.name || 'Sản phẩm',
    price: Number(item.price ?? product.price ?? 0),
    quantity: Number(item.quantity ?? 1),
    image: item.image || item.img || product.image || product.img || product.images?.[0],
  };
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const { user } = useContext(AuthContext);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      return;
    }

    try {
      const res = await cartApi.getCart();
      if (res.success) {
        const items = res.data?.items || res.data || [];
        setCartItems(Array.isArray(items) ? items.map(normalizeCartItem) : []);
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setCartItems([]);
        return;
      }

      console.error('Lỗi lấy giỏ hàng:', err);
    }
  }, [user]);

  useEffect(() => {
    void fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, quantity) => {
    const res = await cartApi.addToCart({ productId, quantity });
    if (res.success) await fetchCart();
    return res;
  };

  const updateQuantity = async (cartItemId, quantity) => {
    if (quantity < 1) {
      return removeItem(cartItemId);
    }

    const res = await cartApi.updateQuantity(cartItemId, quantity);
    if (res.success) await fetchCart();
    return res;
  };

  const removeItem = async (cartItemId) => {
    const res = await cartApi.removeItem(cartItemId);
    if (res.success) await fetchCart();
    return res;
  };

  const subtotal = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cartItems],
  );

  return (
    <CartContext.Provider value={{ cartItems, fetchCart, addToCart, updateQuantity, removeItem, subtotal }}>
      {children}
    </CartContext.Provider>
  );
};
