import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import addressApi from "../../../api/addressApi";
import couponApi from "../../../api/couponApi";
import orderApi from "../../../api/orderApi";
import paymentApi from "../../../api/paymentApi";
// import userApi from "../../../api/userApi";
import { CartContext } from "../../../context/cartContextValue";
import { formatCurrency, getResponseList } from "../../../utils/productUtils";
import styles from "./CheckoutPage.module.css";

// ===== COUPON HELPERS =====
const getCouponId = (coupon) => coupon?.id || coupon?._id || coupon?.couponId || coupon?.coupon_id;
const getCouponCode = (coupon) => coupon?.code || coupon?.couponCode || coupon?.name || "";
const getCouponDiscountType = (coupon) => String(coupon?.discountType || coupon?.type || "").toUpperCase();
const getCouponDiscountValue = (coupon) =>
  Number(coupon?.discountValue ?? coupon?.value ?? coupon?.amount ?? coupon?.discount ?? 0);
const getCouponMinOrder = (coupon) =>
  Number(
    coupon?.minOrderAmount ??
      coupon?.minOrderValue ??
      coupon?.minimumOrderAmount ??
      coupon?.minimumPurchaseAmount ??
      coupon?.minPurchaseAmount ??
      0,
  );
const getCouponMaxDiscount = (coupon) =>
  Number(coupon?.maxDiscountAmount ?? coupon?.maximumDiscountAmount ?? coupon?.maxDiscount ?? 0);
const getCouponEndDate = (coupon) =>
  coupon?.endDate || coupon?.expiredAt || coupon?.expiryDate || coupon?.validUntil;

const isCouponActive = (coupon) => {
  const status = String(coupon?.status || "").toUpperCase();
  const endDate = getCouponEndDate(coupon);
  if (status === "INACTIVE" || status === "EXPIRED" || coupon?.active === false || coupon?.enabled === false) {
    return false;
  }
  if (!endDate) return true;
  const expiredAt = new Date(endDate);
  return Number.isNaN(expiredAt.getTime()) || expiredAt.getTime() >= Date.now();
};

const isPercentCoupon = (coupon) => {
  const type = getCouponDiscountType(coupon);
  const value = getCouponDiscountValue(coupon);
  return type.includes("PERCENT") || (!type && value > 0 && value <= 100);
};

const calculateCouponDiscount = (coupon, amount) => {
  if (!coupon || amount < getCouponMinOrder(coupon)) return 0;
  const value = getCouponDiscountValue(coupon);
  const rawDiscount = isPercentCoupon(coupon) ? (amount * value) / 100 : value;
  const maxDiscount = getCouponMaxDiscount(coupon);
  const cappedDiscount = maxDiscount > 0 ? Math.min(rawDiscount, maxDiscount) : rawDiscount;
  return Math.min(Math.max(cappedDiscount, 0), amount);
};

const getCouponLabel = (coupon) => {
  const value = getCouponDiscountValue(coupon);
  const discount = isPercentCoupon(coupon) ? `${value}%` : formatCurrency(value);
  const minOrder = getCouponMinOrder(coupon);
  const minOrderText = minOrder > 0 ? ` - đơn từ ${formatCurrency(minOrder)}` : "";
  return `${getCouponCode(coupon)} - Giảm ${discount}${minOrderText}`;
};

// ===== ADDRESS HELPERS =====
const getAddressList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.content)) return response.data.content;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.addresses)) return response.addresses;
  return [];
};

const isDefaultAddress = (address) =>
  Boolean(
    address?.isDefault ??
      address?.is_default ??
      address?.defaultAddress ??
      address?.default_address ??
      address?.default,
  );

const getDefaultAddress = (addresses) => addresses.find(isDefaultAddress) || addresses[0] || null;

const joinUniqueAddressParts = (parts) => {
  const seen = new Set();
  return parts
    .flatMap((part) => String(part || "").split(","))
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => {
      const key = part.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(", ");
};

const formatShippingAddress = (address) => {
  if (!address) return "";
  const structuredAddress = joinUniqueAddressParts([
    address.detail,
    address.ward,
    address.wardName,
    address.district,
    address.districtName,
    address.city,
    address.cityName,
    address.province,
    address.provinceName,
  ]);
  if (structuredAddress) return structuredAddress;
  const fullAddress =
    address.fullAddress || address.full_address || address.address || address.addressLine || address.address_line;
  return joinUniqueAddressParts([fullAddress]);
};

const getResponseData = (response) => response?.data || response;
const getOrderId = (response) => {
  const data = getResponseData(response);
  return data?.id || data?.orderId || data?.order?.id || data?.order?.orderId;
};

// ===== COMPONENT =====
export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, subtotal, fetchCart } = useContext(CartContext);

  const [form, setForm] = useState({
    note: "",
    paymentMethod: "COD",
  });

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [addressLoading, setAddressLoading] = useState(true);

  const [coupons, setCoupons] = useState([]);
  const [selectedCouponCode, setSelectedCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(true);
  const [couponError, setCouponError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch addresses + profile
  useEffect(() => {
    const fetchData = async () => {
      setAddressLoading(true);
      try {
        const addressesResult = await addressApi.getMine();
        const addressList = getAddressList(addressesResult);
        setAddresses(addressList);
        const defaultAddr = getDefaultAddress(addressList);
        if (defaultAddr?.id) setSelectedAddressId(defaultAddr.id);
      } catch {
        setAddresses([]);
      } finally {
        setAddressLoading(false);
      }
    };
    void fetchData();
  }, []);

  // Fetch coupons
  useEffect(() => {
    const fetchCoupons = async () => {
      setCouponLoading(true);
      setCouponError("");
      try {
        const response = await couponApi.getAvailable();
        setCoupons(getResponseList(response).filter(isCouponActive));
      } catch (err) {
        setCoupons([]);
        setCouponError(err.response?.data?.message || err.message || "Không thể tải mã giảm giá.");
      } finally {
        setCouponLoading(false);
      }
    };
    void fetchCoupons();
  }, []);

  const selectedCoupon = useMemo(
    () => coupons.find((coupon) => getCouponCode(coupon) === selectedCouponCode) || null,
    [coupons, selectedCouponCode],
  );

  const couponDiscount = useMemo(
    () => calculateCouponDiscount(selectedCoupon, subtotal),
    [selectedCoupon, subtotal],
  );

  const finalTotal = Math.max(subtotal - couponDiscount, 0);

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

    if (!selectedAddressId) {
      setError("Vui lòng chọn địa chỉ giao hàng.");
      return;
    }

    setSubmitting(true);
    setError("");

    let createdOrderId = null;

    try {
      const payload = {
        addressId: selectedAddressId,
        paymentMethod: form.paymentMethod,
        couponCode: getCouponCode(selectedCoupon) || undefined,
        note: form.note.trim() || undefined,
      };

      const res = await orderApi.create(payload);
      const orderData = getResponseData(res);
      createdOrderId = getOrderId(res);
      if (res?.success === false || orderData?.success === false) {
        throw new Error(res?.message || orderData?.message || "Đặt hàng thất bại.");
      }

      if (form.paymentMethod === "BANK_TRANSFER") {
        const orderId = createdOrderId;
        if (!orderId) throw new Error("Không lấy được mã đơn hàng để tạo thanh toán VNPay.");

        const paymentResponse = await paymentApi.createVnpayPayment({ orderId });
        const paymentData = getResponseData(paymentResponse);
        const paymentUrl = paymentData?.paymentUrl;
        if (!paymentUrl) throw new Error("Không nhận được đường dẫn thanh toán VNPay.");

        sessionStorage.setItem("vnpayOrderId", String(orderId));
        window.location.assign(paymentUrl);
        return;
      }

      await fetchCart();
      navigate("/home");
    } catch (err) {
      if (createdOrderId && form.paymentMethod === "BANK_TRANSFER") {
        try {
          await orderApi.cancelOrder(createdOrderId);
          await fetchCart();
        } catch {
          // Nếu hủy nháp thất bại, vẫn trả lỗi gốc để user biết bước thanh toán không hoàn tất.
        }
      }

      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.addressId ||
        err.message ||
        "Không thể đặt hàng. Vui lòng thử lại.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formSide}>
        <h2>Thông tin giao hàng</h2>
        <form id="checkout-form" className={styles.form} onSubmit={handleSubmit}>

          {/* Chọn địa chỉ giao hàng */}
          <div className={styles.fieldGroup}>
            <label htmlFor="address-select">Địa chỉ giao hàng</label>
            {addressLoading ? (
              <p>Đang tải địa chỉ...</p>
            ) : addresses.length === 0 ? (
              <p className={styles.error}>
                Bạn chưa có địa chỉ nào.{" "}
                <a href="/account/addresses">Thêm địa chỉ</a>
              </p>
            ) : (
              <select
                id="address-select"
                value={selectedAddressId || ""}
                onChange={(e) => setSelectedAddressId(Number(e.target.value))}
                required
              >
                <option value="">-- Chọn địa chỉ giao hàng --</option>
                {addresses.map((addr) => (
                  <option key={addr.id} value={addr.id}>
                    {formatShippingAddress(addr)}
                    {isDefaultAddress(addr) ? " (Mặc định)" : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Ghi chú */}
          <textarea
            name="note"
            placeholder="Ghi chú đơn hàng (tùy chọn)"
            rows="4"
            value={form.note}
            onChange={handleChange}
          />

          {/* Phương thức thanh toán */}
          <h2 style={{ marginTop: "40px" }}>Phương thức thanh toán</h2>
          <div className={styles.paymentMethods}>
            <label className={styles.method}>
              <input
                type="radio"
                name="paymentMethod"
                value="COD"
                checked={form.paymentMethod === "COD"}
                onChange={handleChange}
              />
              <span>Thanh toán khi nhận hàng (COD)</span>
            </label>
            <label className={styles.method}>
              <input
                type="radio"
                name="paymentMethod"
                value="BANK_TRANSFER"
                checked={form.paymentMethod === "BANK_TRANSFER"}
                onChange={handleChange}
              />
              <span>Thanh toán qua VNPay</span>
            </label>
          </div>

          {error && <p className={styles.error}>{error}</p>}
        </form>
      </div>

      <div className={styles.orderSide}>
        <div className={styles.orderSummary}>
          <h3>Đơn hàng của bạn</h3>

          {cartItems.map((item) => (
            <div key={item.id} className={styles.itemRow}>
              <span>{item.name} x {item.quantity}</span>
              <span>{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}

          {/* Mã giảm giá */}
          <div className={styles.couponBox}>
            <label htmlFor="checkout-coupon">Mã giảm giá</label>
            <select
              id="checkout-coupon"
              value={selectedCouponCode}
              onChange={(e) => setSelectedCouponCode(e.target.value)}
              disabled={couponLoading || coupons.length === 0}
            >
              <option value="">{couponLoading ? "Đang tải mã..." : "Không dùng mã"}</option>
              {coupons.map((coupon) => {
                const code = getCouponCode(coupon);
                const disabled = subtotal < getCouponMinOrder(coupon);
                return (
                  <option key={getCouponId(coupon) || code} value={code} disabled={disabled}>
                    {getCouponLabel(coupon)}
                  </option>
                );
              })}
            </select>
            {couponError && <p className={styles.error}>{couponError}</p>}
            {selectedCoupon && couponDiscount > 0 && (
              <p>Đã áp dụng mã {getCouponCode(selectedCoupon)}.</p>
            )}
          </div>

          {/* Tổng tiền */}
          <div className={styles.priceRows}>
            <div className={styles.summaryRow}>
              <span>Tạm tính</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Giảm giá</span>
              <span className={styles.discountPrice}>-{formatCurrency(couponDiscount)}</span>
            </div>
          </div>

          <div className={styles.totalRow}>
            <span>Tổng thanh toán</span>
            <span className={styles.totalPrice}>{formatCurrency(finalTotal)}</span>
          </div>

          <button
            className={styles.placeOrderBtn}
            type="submit"
            form="checkout-form"
            disabled={submitting || cartItems.length === 0 || !selectedAddressId}
          >
            {submitting ? "ĐANG ĐẶT HÀNG..." : "ĐẶT HÀNG NGAY"}
          </button>
        </div>
      </div>
    </div>
  );
}
