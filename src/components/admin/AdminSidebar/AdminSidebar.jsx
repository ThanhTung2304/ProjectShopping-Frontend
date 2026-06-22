import { Link, NavLink } from "react-router-dom";
import styles from "./AdminSidebar.module.css";

export default function AdminSidebar() {
  const menuItems = [
    { path: "/admin/dashboard", icon: "ri-dashboard-line", label: "Tổng quan" },
    { path: "/admin/products", icon: "ri-t-shirt-line", label: "Sản phẩm" },
    { path: "/admin/categories", icon: "ri-price-tag-3-line", label: "Danh mục" },
    { path: "/admin/orders", icon: "ri-bill-line", label: "Đơn hàng" },
    { path: "/admin/users", icon: "ri-user-settings-line", label: "Tài khoản" },
    { path: "/admin/inventory", icon: "ri-stack-line", label: "Kho hàng" },
    { path: "/admin/coupons", icon: "ri-coupon-3-line", label: "Ưu đãi" },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoSection}>
        <Link to="/admin/dashboard" className={styles.logo}>
          LEANH <span>ADMIN</span>
        </Link>
      </div>

      <nav className={styles.nav}>
        <p className={styles.sectionTitle}>Menu chính</p>
        <ul className={styles.menuList}>
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => `${styles.menuLink} ${isActive ? styles.active : ""}`}
              >
                <i className={item.icon}></i>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.sidebarFooter}>
        <div className={styles.supportCard}>
          <p>Cần hỗ trợ?</p>
          <small>Liên hệ IT Studio</small>
        </div>
      </div>
    </aside>
  );
}
