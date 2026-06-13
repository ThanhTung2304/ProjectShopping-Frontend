import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import couponApi from "../../../api/couponApi";
import styles from "./VoucherPage.module.css";

const getCouponList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.content)) return response.data.content;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.data?.coupons)) return response.data.coupons;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.coupons)) return response.coupons;
  return [];
};

const formatCurrency = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const getCouponId = (coupon, index) => coupon?.id || coupon?._id || coupon?.couponId || coupon?.code || index;

const getCouponCode = (coupon) => coupon?.code || coupon?.couponCode || coupon?.name || "COUPON";

const getCouponStatus = (coupon) => {
  const status = String(coupon?.status || "").toUpperCase();
  const endDate = coupon?.endDate || coupon?.expiredAt || coupon?.expiryDate || coupon?.validUntil;

  if (status === "INACTIVE" || status === "EXPIRED" || coupon?.active === false || coupon?.enabled === false) {
    return "Đã đóng";
  }

  if (endDate) {
    const expiredAt = new Date(endDate);
    if (!Number.isNaN(expiredAt.getTime()) && expiredAt.getTime() < Date.now()) return "Hết hạn";
  }

  return "Đang mở";
};

const getDiscountLabel = (coupon) => {
  const type = String(coupon?.discountType || coupon?.type || "").toUpperCase();
  const value = coupon?.discountValue ?? coupon?.value ?? coupon?.amount ?? coupon?.discount;

  if (type.includes("PERCENT")) return `Giảm ${Number(value) || 0}%`;
  if (type.includes("FIXED") || type.includes("AMOUNT")) return `Giảm ${formatCurrency(value) || value}`;
  if (Number(value) > 0 && Number(value) <= 100) return `Giảm ${Number(value)}%`;
  if (Number(value) > 100) return `Giảm ${formatCurrency(value)}`;

  return coupon?.title || coupon?.description || "Ưu đãi đặc biệt";
};

const getConditionLabel = (coupon) => {
  const minOrder = coupon?.minOrderAmount ?? coupon?.minOrderValue ?? coupon?.minimumOrderAmount;
  const maxDiscount = coupon?.maxDiscountAmount ?? coupon?.maximumDiscountAmount;

  const parts = [];
  if (formatCurrency(minOrder)) parts.push(`Đơn từ ${formatCurrency(minOrder)}`);
  if (formatCurrency(maxDiscount)) parts.push(`Tối đa ${formatCurrency(maxDiscount)}`);

  return parts.join(" - ") || coupon?.condition || "Áp dụng theo điều kiện của cửa hàng";
};

const getExpiryLabel = (coupon) => {
  const endDate = coupon?.endDate || coupon?.expiredAt || coupon?.expiryDate || coupon?.validUntil;
  const formattedDate = formatDate(endDate);

  return formattedDate ? `Hạn dùng: ${formattedDate}` : "Hạn dùng: Theo chương trình";
};

const getBackendErrorMessage = (err) => {
  if (err.response?.status === 403) {
    return "Backend chưa mở quyền xem danh sách ưu đãi cho khách hàng. Vui lòng cho phép GET /api/coupons hoặc tạo endpoint public cho coupons.";
  }

  const data = err.response?.data;
  if (typeof data === "string") return data;
  if (data?.message) return data.message;
  if (data?.error) return data.error;

  return err.message || "Không thể tải danh sách ưu đãi.";
};

export default function VoucherPage() {
  const [coupons, setCoupons] = useState([]);
  const [copiedCode, setCopiedCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCoupons = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await couponApi.getAvailable();
        setCoupons(getCouponList(response));
      } catch (err) {
        setError(getBackendErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    void fetchCoupons();
  }, []);

  const availableCoupons = useMemo(
    () => coupons.filter((coupon) => getCouponStatus(coupon) === "Đang mở"),
    [coupons],
  );

  const handleCopy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(""), 1800);
    } catch {
      setCopiedCode("");
    }
  };

  return (
    <main className={styles.container}>
      <section className={styles.header}>
        <p className={styles.eyebrow}>Ưu đãi</p>
        <h1>Săn ưu đãi</h1>
        <p>Lưu lại các mã ưu đãi đang mở và dùng khi thanh toán đơn hàng yêu thích.</p>
      </section>

      {loading && <div className={styles.state}>Đang tải ưu đãi...</div>}
      {error && <div className={`${styles.state} ${styles.error}`}>{error}</div>}

      {!loading && !error && availableCoupons.length === 0 && (
        <div className={styles.state}>Hiện chưa có ưu đãi nào đang mở.</div>
      )}

      {!loading && !error && availableCoupons.length > 0 && (
        <section className={styles.grid}>
          {availableCoupons.map((coupon, index) => {
            const code = getCouponCode(coupon);

            return (
              <article className={styles.card} key={getCouponId(coupon, index)}>
                <div>
                  <span className={styles.condition}>{getConditionLabel(coupon)}</span>
                  <h2>{getDiscountLabel(coupon)}</h2>
                  <p>{coupon?.description || getExpiryLabel(coupon)}</p>
                  <small>{getExpiryLabel(coupon)}</small>
                </div>
                <div className={styles.codeRow}>
                  <code>{code}</code>
                  <button type="button" onClick={() => handleCopy(code)}>
                    {copiedCode === code ? "Đã lưu" : "Lưu mã"}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <section className={styles.cta}>
        <h2>Chọn sản phẩm trước, dùng mã ở bước thanh toán.</h2>
        <Link to="/products">Mua sắm ngay</Link>
      </section>
    </main>
  );
}
