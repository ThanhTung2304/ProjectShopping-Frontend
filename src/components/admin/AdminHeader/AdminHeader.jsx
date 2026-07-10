import { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/authContextValue";
import NotificationDropdown from "../../common/NotificationDropdown/NotificationDropdown";
import styles from "./AdminHeader.module.css";

const titleByPath = {
  "/admin/dashboard": "Bảng điều khiển",
  "/admin/products": "Sản phẩm",
  "/admin/categories": "Danh mục",
  "/admin/orders": "Đơn hàng",
  "/admin/users": "Tài khoản",
  "/admin/inventory": "Kho hàng",
  "/admin/coupons": "Ưu đãi",
};

export default function AdminHeader() {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  return (
    <header className={styles.header}>
      <div className={styles.breadcrumb}>
        <span>Trang quản trị</span>
        <span>/</span>
        <span className={styles.current}>{titleByPath[location.pathname] || "Admin"}</span>
      </div>

      <div className={styles.actions}>
        <NotificationDropdown
          isAuthenticated={isAuthenticated}
          className={styles.notificationBtn}
          iconClassName={styles.notificationIcon}
        />

        <div className={styles.userInfo}>
          <p className={styles.name}>{user?.fullName || "Admin"}</p>
          <span className={styles.role}>Quản trị viên</span>
        </div>

        <div className={styles.divider}></div>

        <button onClick={handleLogout} className={styles.logoutBtn} title="Đăng xuất" type="button">
          Đăng xuất
        </button>
      </div>
    </header>
  );
}
