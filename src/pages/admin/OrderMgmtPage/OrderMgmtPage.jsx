import { useEffect, useMemo, useState } from "react";
import orderApi from "../../../api/orderApi";
import { formatMoney, getId, getList, safeText } from "../adminPageUtils";
import styles from "../AdminPages.module.css";

export default function OrderMgmtPage() {
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await orderApi.adminGetAll();
        setOrders(getList(res));
      } catch (err) {
        setError(err.message || "Không thể tải danh sách đơn hàng.");
      } finally {
        setLoading(false);
      }
    };

    void fetchOrders();
  }, []);

  const filteredOrders = useMemo(
    () => orders.filter((order) => String(order.id || order._id || "").includes(query.trim())),
    [orders, query],
  );

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Orders</p>
          <h1>Quản lý đơn hàng</h1>
          <p>Theo dõi trạng thái xử lý và thanh toán.</p>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2>Danh sách đơn hàng</h2>
          <input
            className={styles.searchInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm mã đơn..."
          />
        </div>

        {loading && <div className={styles.loading}>Đang tải đơn hàng...</div>}
        {error && <div className={styles.error}>{error}</div>}
        {!loading && !error && filteredOrders.length === 0 && <div className={styles.empty}>Chưa có đơn hàng.</div>}

        {!loading && !error && filteredOrders.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Thanh toán</th>
                  <th>Trạng thái</th>
                  <th>Tổng tiền</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={getId(order)}>
                    <td className={styles.nameCell}>#{getId(order)}</td>
                    <td>{safeText(order.customerName || order.customer?.fullName || order.user?.fullName)}</td>
                    <td>{safeText(order.paymentMethod || order.paymentStatus)}</td>
                    <td><span className={`${styles.status} ${styles.statusWarn}`}>{safeText(order.status, "Mới")}</span></td>
                    <td>{formatMoney(order.total || order.totalAmount)}</td>
                    <td>
                      <div className={styles.actionRow}>
                        <button className={styles.ghostBtn} type="button">Chi tiết</button>
                        <button className={styles.ghostBtn} type="button">Cập nhật</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
