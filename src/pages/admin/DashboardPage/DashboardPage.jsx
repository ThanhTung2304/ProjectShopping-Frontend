import { useEffect, useMemo, useState } from "react";
import orderApi from "../../../api/orderApi";
import productApi from "../../../api/productApi";
import { formatMoney, getList, getProductDisplayPrice, safeText } from "../adminPageUtils";
import styles from "../AdminPages.module.css";

export default function DashboardPage() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      const [productResult, orderResult] = await Promise.allSettled([
        productApi.getAll(),
        orderApi.adminGetAll(),
      ]);

      if (productResult.status === "fulfilled") {
        setProducts(getList(productResult.value));
      }

      if (orderResult.status === "fulfilled") {
        setOrders(getList(orderResult.value));
      }

      setLoading(false);
    };

    void fetchDashboard();
  }, []);

  const revenue = useMemo(
    () => orders.reduce((total, order) => total + Number(order.total || order.totalAmount || 0), 0),
    [orders],
  );

  const latestOrders = orders.slice(0, 5);

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Dashboard</p>
          <h1>Tổng quan quản trị</h1>
          <p>Theo dõi nhanh sản phẩm, đơn hàng và doanh thu.</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>Sản phẩm</p>
          <h2 className={styles.statValue}>{products.length}</h2>
          <span className={styles.statHint}>Đang hiển thị trong cửa hàng</span>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>Đơn hàng</p>
          <h2 className={styles.statValue}>{orders.length}</h2>
          <span className={styles.statHint}>Tổng số đơn đã tải</span>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>Doanh thu</p>
          <h2 className={styles.statValue}>{formatMoney(revenue)}</h2>
          <span className={styles.statHint}>Tính từ dữ liệu đơn hàng</span>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>Tồn kho thấp</p>
          <h2 className={styles.statValue}>
            {products.filter((product) => Number(product.stock || product.quantity || 0) <= 5).length}
          </h2>
          <span className={styles.statHint}>Cần kiểm tra thêm</span>
        </article>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h2>Đơn hàng mới</h2>
          </div>
          {loading ? (
            <div className={styles.loading}>Đang tải dữ liệu...</div>
          ) : latestOrders.length === 0 ? (
            <div className={styles.empty}>Chưa có dữ liệu đơn hàng.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Khách hàng</th>
                    <th>Trạng thái</th>
                    <th>Tổng tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {latestOrders.map((order) => (
                    <tr key={order.id || order._id}>
                      <td className={styles.nameCell}>#{order.id || order._id}</td>
                      <td>{safeText(order.customerName || order.user?.fullName || order.customer?.fullName)}</td>
                      <td><span className={styles.status}>{safeText(order.status, "Mới")}</span></td>
                      <td>{formatMoney(order.total || order.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={styles.panel}>
          <h2>Sản phẩm nổi bật</h2>
          <div className={styles.list}>
            {products.slice(0, 5).map((product) => (
              <div className={styles.listItem} key={product.id || product._id || product.slug}>
                <strong>{product.name}</strong>
                <span className={styles.muted}>{getProductDisplayPrice(product)}</span>
              </div>
            ))}
            {!loading && products.length === 0 && <p className={styles.muted}>Chưa có sản phẩm.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
