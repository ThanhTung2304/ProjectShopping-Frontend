import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import orderApi from "../../../api/orderApi";
import { CartContext } from "../../../context/cartContextValue";
import styles from "./PaymentReturnPage.module.css";

export default function PaymentReturnPage() {
  const [searchParams] = useSearchParams();
  const { fetchCart } = useContext(CartContext);

  const orderId = searchParams.get("orderId") || sessionStorage.getItem("vnpayOrderId");
  const responseCode = searchParams.get("responseCode") || searchParams.get("vnp_ResponseCode");
  const transactionStatus = searchParams.get("transactionStatus") || searchParams.get("vnp_TransactionStatus");
  const isValidReturn = (searchParams.get("valid") ?? "true") !== "false";

  const isReturnFailed = useMemo(() => {
    if (!responseCode && !transactionStatus) return false;
    return !isValidReturn || responseCode !== "00" || transactionStatus !== "00";
  }, [isValidReturn, responseCode, transactionStatus]);

  const [status, setStatus] = useState("PENDING");
  const [message, setMessage] = useState("Đang xác nhận kết quả thanh toán...");

  useEffect(() => {
    if (!orderId) {
      setStatus("FAILED");
      setMessage("Không tìm thấy mã đơn hàng. Vui lòng xem lại đơn hàng của bạn.");
      return undefined;
    }

    if (isReturnFailed) {
      sessionStorage.removeItem("vnpayOrderId");
      setStatus("FAILED");
      setMessage("Giao dịch đã bị hủy hoặc không thành công. Hệ thống đang chốt trạng thái cuối cùng.");
      void fetchCart();
      return undefined;
    }

    let active = true;
    let timerId;
    const maxPendingChecks = isReturnFailed ? 10 : 20;
    let pendingChecks = 0;

    const checkPaymentStatus = async () => {
      try {
        const response = await orderApi.getOrderDetail(orderId);
        const order = response?.data || response;
        const paymentStatus = String(order?.paymentStatus || "PENDING").toUpperCase();
        if (!active) return;

        setStatus(paymentStatus);
        if (paymentStatus === "PAID") {
          sessionStorage.removeItem("vnpayOrderId");
          await fetchCart();
          setMessage("Thanh toán thành công. Đơn hàng của bạn đang được xử lý.");
          return;
        }
        if (["FAILED", "CANCELLED"].includes(paymentStatus)) {
          sessionStorage.removeItem("vnpayOrderId");
          await fetchCart();
          setMessage("Giao dịch không thành công hoặc đã bị hủy. Giỏ hàng đã được khôi phục.");
          return;
        }

        pendingChecks += 1;
        if (pendingChecks >= maxPendingChecks) {
          if (isReturnFailed) {
            setMessage("Giao dịch đã bị hủy hoặc không thành công. Vui lòng chờ hệ thống xác nhận lại trong giây lát.");
          } else {
            setMessage("Đơn hàng đang chờ xác nhận từ cổng thanh toán. Vui lòng thử lại sau.");
          }
          return;
        }

        timerId = window.setTimeout(checkPaymentStatus, 3000);
      } catch {
        if (active) {
          setStatus("FAILED");
          setMessage("Không thể kiểm tra trạng thái thanh toán. Vui lòng thử lại sau.");
        }
      }
    };

    void checkPaymentStatus();
    return () => {
      active = false;
      window.clearTimeout(timerId);
    };
  }, [fetchCart, isReturnFailed, orderId]);

  const isSuccess = status === "PAID";
  const isFailed = ["FAILED", "CANCELLED"].includes(status);

  return (
    <section className={styles.container}>
      <div className={styles.card}>
        <div className={`${styles.icon} ${isSuccess ? styles.success : isFailed ? styles.failed : styles.pending}`}>
          {isSuccess ? "✓" : isFailed ? "!" : "…"}
        </div>
        <h1>{isSuccess ? "Thanh toán thành công" : isFailed ? "Thanh toán chưa thành công" : "Đang kiểm tra thanh toán"}</h1>
        <p>{message}</p>
        <div className={styles.actions}>
          <Link to="/home" className={styles.primaryButton}>Về trang chủ</Link>
          {isFailed && <Link to="/checkout" className={styles.secondaryButton}>Quay lại thanh toán</Link>}
        </div>
      </div>
    </section>
  );
}
