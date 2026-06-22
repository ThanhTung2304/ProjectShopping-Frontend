import { useEffect, useMemo, useState } from "react";
import couponApi from "../../../api/couponApi";
import Modal from "../../../components/common/Modal/Modal";
import { getId, getList, safeText } from "../adminPageUtils";
import styles from "../AdminPages.module.css";

const initialForm = {
  code: "",
  discountType: "PERCENT",
  discountValue: "",
  minOrderValue: "",
  maxDiscount: "",
  usageLimit: "",
  startDate: "",
  endDate: "",
  active: true,
  description: "",
};

const formatCurrency = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "-";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};

const toInputDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("vi-VN").format(date);
};

const getCouponCode = (coupon) => coupon?.code || coupon?.couponCode || coupon?.name || "-";

const getDiscountText = (coupon) => {
  const type = String(coupon?.discountType || coupon?.type || "").toUpperCase();
  const value = coupon?.discountValue ?? coupon?.value ?? coupon?.amount ?? coupon?.discount;

  if (type.includes("PERCENT")) return `${Number(value) || 0}%`;
  return formatCurrency(value);
};

const getActiveValue = (coupon) => coupon?.active ?? coupon?.enabled ?? coupon?.isActive ?? true;

const normalizeDiscountType = (value) => {
  const type = String(value || "").toUpperCase();
  if (type.includes("PERCENT")) return "PERCENT";
  return "FIXED";
};

const getStatusText = (coupon) => {
  const endDate = coupon?.endDate || coupon?.expiredAt || coupon?.expiryDate || coupon?.validUntil;
  const expiredAt = endDate ? new Date(endDate) : null;

  if (!getActiveValue(coupon)) return "Đã tắt";
  if (expiredAt && !Number.isNaN(expiredAt.getTime()) && expiredAt.getTime() < Date.now()) return "Hết hạn";
  return "Đang mở";
};

const buildForm = (coupon) => ({
  code: getCouponCode(coupon) === "-" ? "" : getCouponCode(coupon),
  discountType: normalizeDiscountType(coupon?.discountType || coupon?.type),
  discountValue: coupon?.discountValue ?? coupon?.value ?? coupon?.amount ?? coupon?.discount ?? "",
  minOrderValue: coupon?.minOrderValue ?? coupon?.minOrderAmount ?? coupon?.minimumOrderAmount ?? "",
  maxDiscount: coupon?.maxDiscount ?? coupon?.maxDiscountAmount ?? coupon?.maximumDiscountAmount ?? "",
  usageLimit: coupon?.usageLimit ?? coupon?.limit ?? coupon?.maxUsage ?? "",
  startDate: toInputDate(coupon?.startDate || coupon?.validFrom),
  endDate: toInputDate(coupon?.endDate || coupon?.expiredAt || coupon?.expiryDate || coupon?.validUntil),
  active: getActiveValue(coupon),
  description: coupon?.description || "",
});

const getPayloadValues = (form, currentCoupon = null) => {
  const discountType = normalizeDiscountType(form.discountType);
  const minOrderValue =
    form.minOrderValue === ""
      ? Number(currentCoupon?.minOrderValue ?? currentCoupon?.minOrderAmount ?? 0)
      : Number(form.minOrderValue);
  const maxDiscount =
    form.maxDiscount === ""
      ? Number(currentCoupon?.maxDiscount ?? currentCoupon?.maxDiscountAmount ?? 0)
      : Number(form.maxDiscount);
  const usageLimit =
    form.usageLimit === ""
      ? Number(currentCoupon?.usageLimit ?? 1)
      : Number(form.usageLimit);

  return {
    id: getId(currentCoupon),
    code: form.code.trim().toUpperCase(),
    discountType,
    discountTypeLong: discountType === "PERCENT" ? "PERCENTAGE" : "FIXED_AMOUNT",
    discountValue: Number(form.discountValue || 0),
    minOrderValue,
    maxDiscount,
    usageLimit,
    startDate: form.startDate || currentCoupon?.startDate || currentCoupon?.validFrom || "",
    endDate: form.endDate || currentCoupon?.endDate || currentCoupon?.expiredAt || currentCoupon?.expiryDate || "",
    active: form.active,
    description: form.description.trim(),
  };
};

const setKnownField = (payload, source, keys, value, fallbackKey) => {
  const matchedKey = keys.find((key) => Object.prototype.hasOwnProperty.call(source || {}, key));
  payload[matchedKey || fallbackKey || keys[0]] = value;
};

const removeCreateOnlyUnsafeFields = (payload) => {
  const unsafeKeys = [
    "id",
    "_id",
    "couponId",
    "coupon_id",
    "createdAt",
    "updatedAt",
    "usedCount",
    "usageCount",
    "created_at",
    "updated_at",
  ];

  unsafeKeys.forEach((key) => {
    delete payload[key];
  });
};

const withoutEmptyValues = (payload) =>
  Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );

const buildPayloadFromShape = (form, { currentCoupon = null, templateCoupon = null } = {}) => {
  const values = getPayloadValues(form, currentCoupon);
  const source = currentCoupon || templateCoupon || {};
  const payload = currentCoupon ? { ...currentCoupon } : {};
  const sourceDiscountType = String(source?.discountType || source?.type || "").toUpperCase();
  const discountTypeForPayload = sourceDiscountType.includes("PERCENTAGE") || sourceDiscountType.includes("FIXED_AMOUNT")
    ? values.discountTypeLong
    : values.discountType;

  setKnownField(payload, source, ["code", "couponCode", "name"], values.code, "code");
  setKnownField(payload, source, ["discountType", "type"], discountTypeForPayload, "discountType");
  setKnownField(
    payload,
    source,
    ["discountValue", "value", "amount", "discount"],
    values.discountValue,
    "discountValue",
  );
  setKnownField(
    payload,
    source,
    ["minOrderValue", "minOrderAmount", "minimumOrderAmount", "minimumPurchaseAmount", "minPurchaseAmount"],
    values.minOrderValue,
    "minOrderValue",
  );
  setKnownField(
    payload,
    source,
    ["maxDiscount", "maxDiscountAmount", "maximumDiscountAmount"],
    values.maxDiscount,
    "maxDiscount",
  );
  setKnownField(payload, source, ["usageLimit", "limit", "maxUsage"], values.usageLimit, "usageLimit");
  setKnownField(payload, source, ["startDate", "validFrom"], values.startDate, "startDate");
  setKnownField(
    payload,
    source,
    ["endDate", "expiredAt", "expiryDate", "validUntil", "validTo", "expirationDate"],
    values.endDate,
    "endDate",
  );
  setKnownField(payload, source, ["description"], values.description, "description");

  if (Object.prototype.hasOwnProperty.call(source, "status")) {
    payload.status = values.active ? "ACTIVE" : "INACTIVE";
  } else {
    setKnownField(payload, source, ["active", "enabled", "isActive"], values.active, "active");
  }

  if (Object.prototype.hasOwnProperty.call(source, "discountPercent")) {
    payload.discountPercent = values.discountType === "PERCENT" ? values.discountValue : 0;
  }
  if (Object.prototype.hasOwnProperty.call(source, "discountPercentage")) {
    payload.discountPercentage = values.discountType === "PERCENT" ? values.discountValue : 0;
  }
  if (Object.prototype.hasOwnProperty.call(source, "discountAmount")) {
    payload.discountAmount = values.discountType === "FIXED" ? values.discountValue : 0;
  }

  if (!currentCoupon) removeCreateOnlyUnsafeFields(payload);

  return withoutEmptyValues(payload);
};

const getBackendErrorMessage = (err) => {
  const data = err.response?.data;
  if (typeof data === "string") return data;
  if (data?.message) return data.message;
  if (data?.error) return data.error;
  if (data?.errors && typeof data.errors === "object") {
    return Object.values(data.errors).flat().join(" ");
  }

  return err.message || "Không thể lưu ưu đãi.";
};

export default function CouponMgmtPage() {
  const [coupons, setCoupons] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalMode, setModalMode] = useState("");
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadCoupons = async () => {
    setLoading(true);
    setError("");

    try {
      setCoupons(getList(await couponApi.getAll()));
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Không thể tải danh sách ưu đãi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCoupons();
  }, []);

  const filteredCoupons = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return coupons;

    return coupons.filter((coupon) =>
      `${getCouponCode(coupon)} ${coupon?.description || ""} ${coupon?.discountType || ""}`
        .toLowerCase()
        .includes(keyword),
    );
  }, [coupons, query]);

  const openCreateModal = () => {
    setModalMode("create");
    setEditingCoupon(null);
    setForm(initialForm);
    setFormError("");
  };

  const openEditModal = (coupon) => {
    setModalMode("edit");
    setEditingCoupon(coupon);
    setForm(buildForm(coupon));
    setFormError("");
  };

  const closeModal = () => {
    if (saving) return;
    setModalMode("");
    setEditingCoupon(null);
    setFormError("");
  };

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validateForm = () => {
    if (!form.code.trim()) return "Vui lòng nhập mã ưu đãi.";
    if (Number(form.discountValue) <= 0) return "Giá trị giảm phải lớn hơn 0.";
    if (form.discountType === "PERCENT" && Number(form.discountValue) > 100) {
      return "Ưu đãi phần trăm không được lớn hơn 100%.";
    }
    if (!form.usageLimit || Number(form.usageLimit) < 1) {
      return "Giới hạn lượt dùng phải lớn hơn hoặc bằng 1.";
    }
    if (!form.startDate) return "Vui lòng chọn ngày bắt đầu.";
    if (!form.endDate) return "Vui lòng chọn ngày kết thúc.";
    if (form.startDate && form.endDate && new Date(form.startDate) > new Date(form.endDate)) {
      return "Ngày bắt đầu không được sau ngày kết thúc.";
    }
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationMessage = validateForm();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const payload = buildPayloadFromShape(form, {
        currentCoupon: modalMode === "edit" ? editingCoupon : null,
        templateCoupon: coupons[0],
      });

      if (modalMode === "create") {
        await couponApi.create(payload);
      } else {
        await couponApi.update(getId(editingCoupon), payload);
      }

      await loadCoupons();
      setModalMode("");
      setEditingCoupon(null);
    } catch (err) {
      setFormError(getBackendErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (coupon) => {
    const id = getId(coupon);
    if (!id) {
      setError("Không tìm thấy mã ưu đãi để xóa.");
      return;
    }

    if (!window.confirm(`Xóa ưu đãi ${getCouponCode(coupon)}?`)) return;

    setDeletingId(id);
    setError("");

    try {
      await couponApi.delete(id);
      await loadCoupons();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Không thể xóa ưu đãi.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Coupons</p>
          <h1>Quản lý ưu đãi</h1>
          <p>Tạo, chỉnh sửa và theo dõi các mã coupon hiển thị ở trang Ưu đãi.</p>
        </div>
        <button className={styles.primaryBtn} type="button" onClick={openCreateModal}>
          Thêm ưu đãi
        </button>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2>Danh sách ưu đãi</h2>
          <input
            className={styles.searchInput}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm mã ưu đãi..."
          />
        </div>

        {loading && <div className={styles.loading}>Đang tải ưu đãi...</div>}
        {error && <div className={styles.error}>{error}</div>}
        {!loading && !error && filteredCoupons.length === 0 && (
          <div className={styles.empty}>Không có ưu đãi phù hợp.</div>
        )}

        {!loading && !error && filteredCoupons.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Giảm giá</th>
                  <th>Đơn tối thiểu</th>
                  <th>Tối đa</th>
                  <th>Lượt dùng</th>
                  <th>Hạn dùng</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoupons.map((coupon, index) => {
                  const id = getId(coupon) || `${getCouponCode(coupon)}-${index}`;
                  const statusText = getStatusText(coupon);

                  return (
                    <tr key={id}>
                      <td className={styles.nameCell}>{safeText(getCouponCode(coupon))}</td>
                      <td>{getDiscountText(coupon)}</td>
                      <td>{formatCurrency(coupon?.minOrderValue ?? coupon?.minOrderAmount)}</td>
                      <td>{formatCurrency(coupon?.maxDiscount ?? coupon?.maxDiscountAmount)}</td>
                      <td>
                        {coupon?.usedCount ?? 0} / {coupon?.usageLimit ?? "-"}
                      </td>
                      <td>{formatDate(coupon?.endDate || coupon?.expiredAt || coupon?.expiryDate)}</td>
                      <td>
                        <span
                          className={`${styles.status} ${
                            statusText === "Đang mở" ? styles.statusSuccess : styles.statusDanger
                          }`}
                        >
                          {statusText}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionRow}>
                          <button className={styles.ghostBtn} type="button" onClick={() => openEditModal(coupon)}>
                            Sửa
                          </button>
                          <button
                            className={styles.ghostBtn}
                            type="button"
                            disabled={deletingId === getId(coupon)}
                            onClick={() => handleDelete(coupon)}
                          >
                            Xóa
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
        isOpen={Boolean(modalMode)}
        onClose={closeModal}
        title={modalMode === "create" ? "Thêm ưu đãi" : "Sửa ưu đãi"}
        footer={
          <>
            <button className={styles.ghostBtn} type="button" onClick={closeModal} disabled={saving}>
              Hủy
            </button>
            <button className={styles.primaryBtn} type="submit" form="coupon-form" disabled={saving}>
              {saving ? "Đang lưu..." : modalMode === "create" ? "Thêm ưu đãi" : "Lưu thay đổi"}
            </button>
          </>
        }
      >
        <form id="coupon-form" className={styles.formGrid} onSubmit={handleSubmit}>
          {formError && <div className={styles.formError}>{formError}</div>}

          <label className={styles.field}>
            <span>Mã ưu đãi</span>
            <input value={form.code} onChange={(event) => updateForm("code", event.target.value)} />
          </label>

          <label className={styles.field}>
            <span>Loại giảm giá</span>
            <select value={form.discountType} onChange={(event) => updateForm("discountType", event.target.value)}>
              <option value="PERCENT">Phần trăm</option>
              <option value="FIXED">Số tiền cố định</option>
            </select>
          </label>

          <label className={styles.field}>
            <span>Giá trị giảm</span>
            <input
              min="0"
              type="number"
              value={form.discountValue}
              onChange={(event) => updateForm("discountValue", event.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span>Đơn tối thiểu</span>
            <input
              min="0"
              type="number"
              value={form.minOrderValue}
              onChange={(event) => updateForm("minOrderValue", event.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span>Giảm tối đa</span>
            <input
              min="0"
              type="number"
              value={form.maxDiscount}
              onChange={(event) => updateForm("maxDiscount", event.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span>Giới hạn lượt dùng</span>
            <input
              min="1"
              type="number"
              value={form.usageLimit}
              onChange={(event) => updateForm("usageLimit", event.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span>Ngày bắt đầu</span>
            <input type="date" value={form.startDate} onChange={(event) => updateForm("startDate", event.target.value)} />
          </label>

          <label className={styles.field}>
            <span>Ngày kết thúc</span>
            <input type="date" value={form.endDate} onChange={(event) => updateForm("endDate", event.target.value)} />
          </label>

          <label className={`${styles.checkboxField} ${styles.fullField}`}>
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => updateForm("active", event.target.checked)}
            />
            <span>Đang mở ưu đãi này</span>
          </label>

          <label className={`${styles.field} ${styles.fullField}`}>
            <span>Mô tả</span>
            <textarea value={form.description} onChange={(event) => updateForm("description", event.target.value)} />
          </label>
        </form>
      </Modal>
    </section>
  );
}