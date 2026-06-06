import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import orderApi from "../../../api/orderApi";
import { CartContext } from "../../../context/cartContextValue";
import styles from "./CheckoutPage.module.css";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, subtotal, fetchCart } = useContext(CartContext);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    note: "",
    paymentMethod: "cod",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      setError("Giỏ hàng đang trống.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const payload = {
        customer: {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
        },
        shippingAddress: form.address.trim(),
        note: form.note.trim(),
        paymentMethod: form.paymentMethod,
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        total: subtotal,
      };

      const res = await orderApi.create(payload);
      if (!res.success) throw new Error(res.message || "Đặt hàng thất bại.");

      await fetchCart();
      navigate("/home");
    } catch (err) {
      setError(err.message || "Không thể đặt hàng. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formSide}>
        <h2>Thông tin giao hàng</h2>
        <form id="checkout-form" className={styles.form} onSubmit={handleSubmit}>
          <input name="fullName" type="text" placeholder="Họ và tên" value={form.fullName} onChange={handleChange} required />
          <div className={styles.row}>
            <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
            <input name="phone" type="tel" placeholder="Số điện thoại" value={form.phone} onChange={handleChange} required />
          </div>
          <input name="address" type="text" placeholder="Địa chỉ chi tiết" value={form.address} onChange={handleChange} required />
          <textarea name="note" placeholder="Ghi chú đơn hàng (tùy chọn)" rows="4" value={form.note} onChange={handleChange}></textarea>
          
          <h2 style={{marginTop: '40px'}}>Phương thức thanh toán</h2>
          <div className={styles.paymentMethods}>
            <label className={styles.method}>
              <input type="radio" name="paymentMethod" value="cod" checked={form.paymentMethod === "cod"} onChange={handleChange} />
              <span>Thanh toán khi nhận hàng (COD)</span>
            </label>
            <label className={styles.method}>
              <input type="radio" name="paymentMethod" value="bank_transfer" checked={form.paymentMethod === "bank_transfer"} onChange={handleChange} />
              <span>Chuyển khoản ngân hàng</span>
            </label>
          </div>
          {error && <p className={styles.error}>{error}</p>}
        </form>
      </div>

      <div className={styles.orderSide}>
        <div className={styles.orderSummary}>
          <h3>Đơn hàng của bạn</h3>
          {cartItems.map(item => (
            <div key={item.id} className={styles.itemRow}>
              <span>{item.name} x {item.quantity}</span>
              <span>{(item.price * item.quantity).toLocaleString()} VNĐ</span>
            </div>
          ))}
          <div className={styles.totalRow}>
            <span>Tổng thanh toán</span>
            <span className={styles.totalPrice}>{subtotal.toLocaleString()} VNĐ</span>
          </div>
          <button className={styles.placeOrderBtn} type="submit" form="checkout-form" disabled={submitting || cartItems.length === 0}>
            {submitting ? "ĐANG ĐẶT HÀNG..." : "ĐẶT HÀNG NGAY"}
          </button>
        </div>
      </div>
    </div>
  );
}
