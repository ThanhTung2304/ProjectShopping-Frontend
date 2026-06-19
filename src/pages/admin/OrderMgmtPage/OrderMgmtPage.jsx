import { useEffect, useMemo, useState } from "react";
import orderApi from "../../../api/orderApi";
import Modal from "../../../components/common/Modal/Modal";
import { formatMoney, getList, safeText } from "../adminPageUtils";
import styles from "../AdminPages.module.css";

const ORDER_STATUS_FLOW = ["PENDING", "CONFIRMED", "SHIPPING", "DELIVERED"];

const formatMonthValue = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const getOrderId = (order) => order?.id;

const getOrderCode = (order) => order?.orderCode || getOrderId(order);

const getOrderStatus = (order) => String(order?.status || "PENDING").toUpperCase();

const getOrderDate = (order) => {
  const value = order?.orderedAt;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isOrderInMonth = (order, selectedMonth) => {
  if (!selectedMonth) return true;
  const date = getOrderDate(order);
  return date ? formatMonthValue(date) === selectedMonth : false;
};

const getNextOrderStatus = (order) => {
  const status = getOrderStatus(order);
  const currentIndex = ORDER_STATUS_FLOW.indexOf(status);

  if (currentIndex < 0) return "CONFIRMED";
  return ORDER_STATUS_FLOW[Math.min(currentIndex + 1, ORDER_STATUS_FLOW.length - 1)];
};

const canUpdateOrderStatus = (order) => {
  const status = getOrderStatus(order);
  return status !== "DELIVERED" && status !== "CANCELLED";
};

const getOrderStatusClass = (order) => {
  const status = getOrderStatus(order);
  if (status === "DELIVERED") return styles.statusSuccess;
  if (status === "CANCELLED") return styles.statusDanger;
  return styles.statusWarn;
};

const getNextStatusLabel = (order) => {
  const labels = {
    CONFIRMED: "Xác nhận",
    SHIPPING: "Bắt đầu giao",
    DELIVERED: "Đã giao",
  };
  return labels[getNextOrderStatus(order)] || "Cập nhật";
};

const joinParts = (parts) => parts.map((part) => String(part || "").trim()).filter(Boolean).join(", ");

const getCustomerName = (order) => order?.shippingName;
const getCustomerPhone = (order) => order?.shippingPhone;
const getShippingAddress = (order) => order?.shippingAddress || "";
const getOrderTotal = (order) => order?.finalAmount ?? order?.totalAmount ?? 0;
const getPaymentText = (order) => joinParts([order?.paymentMethod, order?.paymentStatus]);
const getOrderItems = (order) => getList(order?.items);
const getItemName = (item) => item?.productName || "Sản phẩm";
const getItemVariant = (item) => joinParts([item?.size, item?.color]);
const getItemQuantity = (item) => Number(item?.quantity ?? 1);
const getItemPrice = (item) => item?.unitPrice || 0;

export default function OrderMgmtPage() {
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => formatMonthValue(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoadingId, setDetailLoadingId] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await orderApi.adminGetAllOrders();
        const list = response?.data?.content || [];
        setOrders(list);
      } catch (err) {
        setError(err.response?.data?.message || "Không thể tải danh sách đơn hàng.");
      } finally {
        setLoading(false);
      }
    };

    void fetchOrders();
  }, []);

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        if (!isOrderInMonth(order, selectedMonth)) return false;

        const keyword = query.trim().toLowerCase();
        if (!keyword) return true;

        return [getOrderCode(order), getCustomerName(order), getCustomerPhone(order)]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      }),
    [orders, query, selectedMonth],
  );

  const openOrderDetail = async (order) => {
    const orderId = getOrderId(order);
    setDetailLoadingId(orderId);

    try {
      const detail = await orderApi.adminGetOrderDetail(orderId);
      setSelectedOrder({ ...order, ...detail?.data });
    } catch {
      setSelectedOrder(order);
    } finally {
      setDetailLoadingId(null);
    }
  };

  const handleUpdateStatus = async (order) => {
    const orderId = getOrderId(order);
    const nextStatus = getNextOrderStatus(order);
    setUpdatingOrderId(orderId);
    setError("");

    try {
      const response = await orderApi.adminUpdateStatus(orderId, nextStatus);
      const updated = response?.data;

      setOrders((current) =>
        current.map((o) => (o.id === orderId ? { ...o, ...updated } : o)),
      );

      setSelectedOrder((current) =>
        current && current.id === orderId ? { ...current, ...updated } : current,
      );
    } catch (err) {
      setError(err.response?.data?.message || "Không thể cập nhật trạng thái đơn hàng.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const selectedOrderItems = selectedOrder ? getOrderItems(selectedOrder) : [];

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
          <div className={styles.filterRow}>
            <input
              className={styles.searchInput}
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              aria-label="Chọn tháng đơn hàng"
            />
            <input
              className={styles.searchInput}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm mã đơn, tên, SĐT..."
            />
          </div>
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
                {filteredOrders.map((order) => {
                  const orderId = getOrderId(order);
                  const isUpdating = String(updatingOrderId) === String(orderId);
                  const isLoadingDetail = String(detailLoadingId) === String(orderId);

                  return (
                    <tr key={orderId}>
                      <td className={styles.nameCell}>#{getOrderCode(order)}</td>
                      <td>
                        <strong>{safeText(getCustomerName(order))}</strong>
                        <span className={styles.cellSubtext}>{safeText(getCustomerPhone(order), "")}</span>
                      </td>
                      <td>{safeText(getPaymentText(order))}</td>
                      <td>
                        <span className={`${styles.status} ${getOrderStatusClass(order)}`}>
                          {safeText(order.status, "Mới")}
                        </span>
                      </td>
                      <td>{formatMoney(getOrderTotal(order))}</td>
                      <td>
                        <div className={styles.actionRow}>
                          <button
                            className={styles.ghostBtn}
                            type="button"
                            onClick={() => openOrderDetail(order)}
                            disabled={isLoadingDetail || isUpdating}
                          >
                            {isLoadingDetail ? "Đang tải" : "Chi tiết"}
                          </button>
                          <button
                            className={styles.ghostBtn}
                            type="button"
                            onClick={() => handleUpdateStatus(order)}
                            disabled={isUpdating || !canUpdateOrderStatus(order)}
                          >
                            {isUpdating ? "Đang cập nhật..." : getNextStatusLabel(order)}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Đơn hàng #${getOrderCode(selectedOrder)}` : "Chi tiết đơn hàng"}
      >
        {selectedOrder && (
          <div className={styles.orderDetail}>
            <div className={styles.detailGrid}>
              <div>
                <span>Khách hàng</span>
                <strong>{safeText(getCustomerName(selectedOrder))}</strong>
              </div>
              <div>
                <span>Số điện thoại</span>
                <strong>{safeText(getCustomerPhone(selectedOrder))}</strong>
              </div>
              <div>
                <span>Thanh toán</span>
                <strong>{safeText(getPaymentText(selectedOrder))}</strong>
              </div>
              <div>
                <span>Trạng thái</span>
                <strong>{safeText(selectedOrder.status, "Mới")}</strong>
              </div>
              <div>
                <span>Tổng tiền</span>
                <strong>{formatMoney(getOrderTotal(selectedOrder))}</strong>
              </div>
            </div>

            <div className={styles.detailBlock}>
              <span>Địa chỉ giao hàng</span>
              <p>{safeText(getShippingAddress(selectedOrder))}</p>
            </div>

            <div className={styles.detailBlock}>
              <span>Ghi chú</span>
              <p>{safeText(selectedOrder.note)}</p>
            </div>

            <div className={styles.detailBlock}>
              <span>Sản phẩm</span>
              {selectedOrderItems.length > 0 ? (
                <div className={styles.detailItems}>
                  {selectedOrderItems.map((item, index) => (
                    <div className={styles.detailItem} key={item.id || index}>
                      <div>
                        <strong>{getItemName(item)}</strong>
                        {getItemVariant(item) && <small>{getItemVariant(item)}</small>}
                      </div>
                      <span>
                        x{getItemQuantity(item)} - {formatMoney(getItemPrice(item))}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Chưa có dữ liệu sản phẩm.</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}