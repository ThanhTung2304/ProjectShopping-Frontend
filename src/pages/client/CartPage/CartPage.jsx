import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../../../context/cartContextValue";
import styles from "./CartPage.module.css";

export default function CartPage() {
  const { cartItems, updateQuantity, removeItem, subtotal } = useContext(CartContext);
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className={styles.empty}>
        <h2>Giỏ hàng của bạn đang trống</h2>
        <button onClick={() => navigate("/products")}>TIẾP TỤC MUA SẮM</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.cartList}>
        <h1>GIỎ HÀNG ({cartItems.length})</h1>
        {cartItems.map((item) => (
          <div key={item.id} className={styles.cartItem}>
            <img src={item.image || "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=200"} alt={item.name} />
            <div className={styles.itemInfo}>
              <h3>{item.name}</h3>
              <p className={styles.itemPrice}>{item.price?.toLocaleString()} VNĐ</p>
              <div className={styles.itemActions}>
                <div className={styles.qty}>
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                </div>
                <button onClick={() => removeItem(item.id)} className={styles.removeBtn}>Xóa</button>
              </div>
            </div>
            <div className={styles.itemTotal}>
              {(item.price * item.quantity).toLocaleString()} VNĐ
            </div>
          </div>
        ))}
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <h3>TỔNG ĐƠN HÀNG</h3>
          <div className={styles.row}>
            <span>Tạm tính</span>
            <span>{subtotal.toLocaleString()} VNĐ</span>
          </div>
          <div className={styles.row}>
            <span>Giao hàng</span>
            <span>Miễn phí</span>
          </div>
          <div className={`${styles.row} ${styles.total}`}>
            <span>Tổng cộng</span>
            <span>{subtotal.toLocaleString()} VNĐ</span>
          </div>
          <button className={styles.checkoutBtn} onClick={() => navigate("/checkout")}>
            TIẾN HÀNH THANH TOÁN
          </button>
        </div>
      </div>
    </div>
  );
}
