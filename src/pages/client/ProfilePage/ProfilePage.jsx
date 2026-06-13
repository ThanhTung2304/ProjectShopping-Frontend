import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import orderApi from "../../../api/orderApi";
import userApi from "../../../api/userApi";
import { AuthContext } from "../../../context/authContextValue";
import { formatCurrency, getResponseList } from "../../../utils/productUtils";
import styles from "./ProfilePage.module.css";

const initialProfile = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
};

const statusLabels = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  processing: "Đang xử lý",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};

const getOrderTotal = (order) =>
  Number(order.total || order.totalAmount || order.finalTotal || order.grandTotal || 0);

const getOrderDate = (order) => {
  const value = order.createdAt || order.createdDate || order.orderDate || order.date;
  if (!value) return "Chưa có ngày";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

export default function ProfilePage() {
  const { user, login, logout } = useContext(AuthContext);
  const [profileForm, setProfileForm] = useState(initialProfile);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [orders, setOrders] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fallbackProfile = {
      fullName: user?.fullName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
    };

    setProfileForm(fallbackProfile);

    userApi
      .getMe()
      .then((res) => {
        const profile = res?.data || res?.user || res;
        const nextProfile = {
          fullName: profile?.fullName || profile?.name || fallbackProfile.fullName,
          email: profile?.email || fallbackProfile.email,
          phone: profile?.phone || fallbackProfile.phone,
          address: profile?.address || fallbackProfile.address,
        };

        setProfileForm(nextProfile);
      })
      .catch(() => setProfileForm(fallbackProfile))
      .finally(() => setLoadingProfile(false));
  }, [user]);

  useEffect(() => {
    orderApi
      .getMine()
      .then((res) => setOrders(getResponseList(res)))
      .catch(() => setOrders([]))
      .finally(() => setLoadingOrders(false));
  }, []);

  const initials = useMemo(() => {
    const name = profileForm.fullName || profileForm.email || "Khách hàng";
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }, [profileForm.fullName, profileForm.email]);

  const recentOrders = orders.slice(0, 4);
  const deliveredCount = orders.filter((order) => String(order.status).toLowerCase() === "delivered").length;
  const totalSpent = orders.reduce((sum, order) => sum + getOrderTotal(order), 0);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage("");
    setError("");

    try {
      const payload = {
        fullName: profileForm.fullName.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
        address: profileForm.address.trim(),
      };
      const res = await userApi.updateMe(payload).catch(() => userApi.updateProfile(payload));
      if (res?.success === false) throw new Error(res.message || "Không thể cập nhật hồ sơ.");

      login({ ...user, ...payload });
      setProfileMessage("Đã lưu thông tin tài khoản.");
    } catch (err) {
      setError(err.message || "Không thể cập nhật hồ sơ. Vui lòng thử lại.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMessage("");
    setError("");

    if (passwordForm.newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setSavingPassword(true);

    try {
      const payload = {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      };
      const res = await userApi.changeMyPassword(payload).catch(() => userApi.changePassword(payload));
      if (res?.success === false) throw new Error(res.message || "Không thể đổi mật khẩu.");

      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordMessage("Đã đổi mật khẩu thành công.");
    } catch (err) {
      setError(err.message || "Không thể đổi mật khẩu. Vui lòng kiểm tra lại.");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.avatar}>{initials}</div>
        <div>
          <p className={styles.eyebrow}>Tài khoản khách hàng</p>
          <h1>{profileForm.fullName || "Khách hàng LeAnh Studio"}</h1>
          <p className={styles.heroText}>
            Quản lý thông tin cá nhân, theo dõi đơn hàng và cập nhật bảo mật tài khoản của bạn.
          </p>
        </div>
        <button className={styles.logoutBtn} type="button" onClick={logout}>
          Đăng xuất
        </button>
      </section>

      {error && <div className={styles.error}>{error}</div>}

      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span>Tổng đơn hàng</span>
          <strong>{orders.length}</strong>
        </div>
        <div className={styles.statCard}>
          <span>Đã giao</span>
          <strong>{deliveredCount}</strong>
        </div>
        <div className={styles.statCard}>
          <span>Tổng chi tiêu</span>
          <strong>{formatCurrency(totalSpent)}</strong>
        </div>
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelLabel}>Hồ sơ</p>
              <h2>Thông tin cá nhân</h2>
            </div>
            {loadingProfile && <span className={styles.muted}>Đang tải...</span>}
          </div>

          <form className={styles.form} onSubmit={handleProfileSubmit}>
            <label>
              Họ và tên
              <input name="fullName" value={profileForm.fullName} onChange={handleProfileChange} />
            </label>
            <label>
              Email
              <input name="email" type="email" value={profileForm.email} onChange={handleProfileChange} />
            </label>
            <label>
              Số điện thoại
              <input name="phone" value={profileForm.phone} onChange={handleProfileChange} />
            </label>
            <label>
              Địa chỉ mặc định
              <textarea name="address" rows="3" value={profileForm.address} onChange={handleProfileChange} />
            </label>
            {profileMessage && <p className={styles.success}>{profileMessage}</p>}
            <button className={styles.primaryBtn} type="submit" disabled={savingProfile}>
              {savingProfile ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </form>
        </section>

        <aside className={styles.sideStack}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelLabel}>Đơn hàng</p>
                <h2>Gần đây</h2>
              </div>
              <Link className={styles.textLink} to="/products">
                Mua thêm
              </Link>
            </div>

            {loadingOrders ? (
              <p className={styles.emptyText}>Đang tải đơn hàng...</p>
            ) : recentOrders.length > 0 ? (
              <div className={styles.orderList}>
                {recentOrders.map((order) => {
                  const status = String(order.status || "pending").toLowerCase();
                  return (
                    <div className={styles.orderItem} key={order.id || order._id || order.orderCode}>
                      <div>
                        <strong>#{order.orderCode || order.id || order._id}</strong>
                        <span>{getOrderDate(order)}</span>
                      </div>
                      <div className={styles.orderMeta}>
                        <span className={`${styles.status} ${styles[status] || ""}`}>
                          {statusLabels[status] || order.status || "Chờ xử lý"}
                        </span>
                        <b>{formatCurrency(getOrderTotal(order))}</b>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={styles.emptyText}>Bạn chưa có đơn hàng nào.</p>
            )}
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelLabel}>Bảo mật</p>
                <h2>Đổi mật khẩu</h2>
              </div>
            </div>
            <form className={styles.form} onSubmit={handlePasswordSubmit}>
              <label>
                Mật khẩu hiện tại
                <input
                  name="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </label>
              <label>
                Mật khẩu mới
                <input
                  name="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </label>
              <label>
                Xác nhận mật khẩu
                <input
                  name="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </label>
              {passwordMessage && <p className={styles.success}>{passwordMessage}</p>}
              <button className={styles.secondaryBtn} type="submit" disabled={savingPassword}>
                {savingPassword ? "Đang đổi..." : "Cập nhật mật khẩu"}
              </button>
            </form>
          </section>
        </aside>
      </div>
    </div>
  );
}
