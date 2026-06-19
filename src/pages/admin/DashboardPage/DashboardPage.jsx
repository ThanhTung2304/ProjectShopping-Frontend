import { useEffect, useMemo, useState } from "react";
import orderApi from "../../../api/orderApi";
import productApi from "../../../api/productApi";
import { formatMoney, getList, getProductDisplayPrice, isLowStock, safeText } from "../adminPageUtils";
import styles from "../AdminPages.module.css";

const getOrderId = (order) => order?.id;

const getOrderCode = (order) => order?.orderCode || getOrderId(order);

const getCustomerName = (order) => order?.shippingName;

const getOrderTotal = (order) => order?.finalAmount ?? order?.totalAmount ?? 0;

const getOrderStatus = (order) => String(order?.status || "PENDING").toUpperCase();

const getOrderStatusClass = (order) => {
  const status = getOrderStatus(order);
  if (status === "DELIVERED") return styles.statusSuccess;
  if (status === "CANCELLED") return styles.statusDanger;
  return styles.statusWarn;
};

const MONTH_LABELS = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];

const REVENUE_STATUSES = ["DELIVERED"];

const isRevenueOrder = (order) => REVENUE_STATUSES.includes(getOrderStatus(order));

const getOrderDate = (order) => {
  const value = order?.orderedAt;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isSameMonth = (date, targetDate) =>
  date && date.getFullYear() === targetDate.getFullYear() && date.getMonth() === targetDate.getMonth();

export default function DashboardPage() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(() => new Date());

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      const [productResult, orderResult] = await Promise.allSettled([
        productApi.getAll(),
        orderApi.adminGetAllOrders(),
      ]);

      if (productResult.status === "fulfilled") {
        setProducts(getList(productResult.value));
      }

      if (orderResult.status === "fulfilled") {
        const list = orderResult.value?.data?.content || [];
        setOrders(list);
      }

      setLoading(false);
    };

    void fetchDashboard();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentDate(new Date()), 60 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  const monthlyOrders = useMemo(
    () => orders.filter((order) => isSameMonth(getOrderDate(order), currentDate)),
    [orders, currentDate],
  );

  const revenue = useMemo(
    () => monthlyOrders.filter(isRevenueOrder).reduce((total, order) => total + Number(getOrderTotal(order)), 0),
    [monthlyOrders],
  );

  const monthlyRevenueStats = useMemo(
    () => {
      const currentYear = currentDate.getFullYear();
      const months = MONTH_LABELS.map((label, index) => ({
        label,
        revenue: 0,
        monthIndex: index,
      }));

      orders.filter(isRevenueOrder).forEach((order) => {
        const date = getOrderDate(order);
        if (!date || date.getFullYear() !== currentYear) return;

        months[date.getMonth()].revenue += Number(getOrderTotal(order));
      });

      const maxRevenue = Math.max(...months.map((month) => month.revenue), 0);

      return months.map((month) => ({
        ...month,
        percent: maxRevenue > 0 ? Math.round((month.revenue / maxRevenue) * 100) : 0,
      }));
    },
    [orders, currentDate],
  );

  const lowStockCount = useMemo(
    () => products.filter(isLowStock).length,
    [products],
  );

  const latestOrders = monthlyOrders.slice(0, 5);

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Dashboard</p>
          <h1>Tổng quan quản trị</h1>
          <p>Theo dõi nhanh sản phẩm, đơn hàng, doanh thu và tồn kho theo biến thể.</p>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div>
            <h2>Doanh thu theo tháng</h2>
            <p className={styles.tableSubtext}>Thống kê doanh thu bán sản phẩm theo từng tháng trong năm hiện tại.</p>
          </div>
        </div>
        {loading ? (
          <div className={styles.loading}>Đang tải dữ liệu...</div>
        ) : (
          <div className={styles.revenueChart}>
            {monthlyRevenueStats.map((month) => (
              <div className={styles.chartColumn} key={month.label} title={`${month.label}: ${formatMoney(month.revenue)}`}>
                <span className={styles.chartValue}>{formatMoney(month.revenue)}</span>
                <div className={styles.chartTrack}>
                  <div
                    className={styles.chartBar}
                    style={{ height: month.revenue > 0 ? `${Math.max(month.percent, 4)}%` : 0 }}
                  />
                </div>
                <span className={styles.chartLabel}>{month.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.statsGrid}>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>Sản phẩm</p>
          <h2 className={styles.statValue}>{products.length}</h2>
          <span className={styles.statHint}>Đang hiển thị trong cửa hàng</span>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>Đơn hàng</p>
          <h2 className={styles.statValue}>{monthlyOrders.length}</h2>
          <span className={styles.statHint}>Tính trong tháng hiện tại</span>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>Doanh thu bán sản phẩm</p>
          <h2 className={styles.statValue}>{formatMoney(revenue)}</h2>
          <span className={styles.statHint}>Chỉ tính đơn đã giao thành công trong tháng</span>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>Tồn kho thấp</p>
          <h2 className={styles.statValue}>{lowStockCount}</h2>
          <span className={styles.statHint}>Tính từ product variants</span>
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
                    <tr key={getOrderId(order)}>
                      <td className={styles.nameCell}>#{getOrderCode(order)}</td>
                      <td>{safeText(getCustomerName(order))}</td>
                      <td><span className={`${styles.status} ${getOrderStatusClass(order)}`}>{safeText(order.status, "Mới")}</span></td>
                      <td>{formatMoney(getOrderTotal(order))}</td>
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
