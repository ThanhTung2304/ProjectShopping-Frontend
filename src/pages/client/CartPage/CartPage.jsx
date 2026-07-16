import { Link, useNavigate } from "react-router-dom";
import useCart from "../../../hooks/useCart";
import { formatCurrency } from "../../../utils/productUtils";
import styles from "./CartPage.module.css";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=400&q=80";

export default function CartPage() {
  const {
    cartItems,
    itemCount,
    loading,
    error,
    subtotal,
    submittingItemId,
    changeQuantity,
    removeItem,
    clearItems,
  } = useCart();
  const navigate = useNavigate();

  const isSubmittingAll = submittingItemId === "all";

  const handleClearCart = async () => {
    if (!window.confirm("Bạn muốn xóa toàn bộ giỏ hàng?")) return;
    await clearItems();
  };

  if (loading && cartItems.length === 0) {
    return <div className={styles.emptyContainer}>Đang tải giỏ hàng...</div>;
  }

  if (cartItems.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyIcon}>0</div>
        <h2>Giỏ hàng của bạn đang trống</h2>
        <p>Chọn thêm sản phẩm yêu thích để bắt đầu đơn hàng.</p>
        <button className={styles.continueBtn} onClick={() => navigate("/products")} type="button">
          Tiếp tục mua sắm
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.cartWrapper}>
        <section>
          <div className={styles.headingRow}>
            <h1 className={styles.title}>
              Giỏ hàng <span>{itemCount} sản phẩm</span>
            </h1>
            <button
              className={styles.clearBtn}
              type="button"
              onClick={handleClearCart}
              disabled={isSubmittingAll}
            >
              Xóa tất cả
            </button>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          {cartItems.map((item) => {
            const isSubmitting = submittingItemId === item.id || isSubmittingAll;
            const itemTotal = Number(item.price || 0) * Number(item.quantity || 0);

            return (
              <div key={item.id} className={styles.cartItem}>
                <div className={styles.productInfo}>
                  <img
                    src={item.image || FALLBACK_IMAGE}
                    alt={item.name}
                    onError={(event) => {
                      event.currentTarget.src = FALLBACK_IMAGE;
                    }}
                  />
                  <div className={styles.details}>
                    <h3>{item.name}</h3>
                    <p className={styles.price}>{formatCurrency(item.price)}</p>
                    <button
                      className={styles.removeBtn}
                      type="button"
                      onClick={() => removeItem(item.id)}
                      disabled={isSubmitting}
                    >
                      Xóa
                    </button>
                  </div>
                </div>

                <div className={styles.qtyPicker}>
                  <button
                    type="button"
                    onClick={() => changeQuantity(item.id, item.quantity - 1)}
                    disabled={isSubmitting}
                    aria-label={`Giảm số lượng ${item.name}`}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => changeQuantity(item.id, item.quantity + 1)}
                    disabled={isSubmitting}
                    aria-label={`Tăng số lượng ${item.name}`}
                  >
                    +
                  </button>
                </div>

                <div className={styles.itemTotal}>{formatCurrency(itemTotal)}</div>
              </div>
            );
          })}
        </section>

        <aside className={styles.summary}>
          <div className={styles.summaryCard}>
            <h3>Tổng đơn hàng</h3>
            <div className={styles.row}>
              <span>Tạm tính</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className={styles.row}>
              <span>Giao hàng</span>
              <span className={styles.free}>Miễn phí</span>
            </div>
            <div className={styles.divider} />
            <div className={`${styles.row} ${styles.total}`}>
              <span>Tổng cộng</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <button className={styles.checkoutBtn} onClick={() => navigate("/checkout")} type="button">
              Tiến hành thanh toán
            </button>
            <Link to="/products" className={styles.backLink}>
              Tiếp tục mua sắm
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
