import { Outlet } from "react-router-dom";
import AdminSidebar from "../../components/admin/AdminSidebar/AdminSidebar";
import AdminHeader from "../../components/admin/AdminHeader/AdminHeader";
import styles from "./AdminLayout.module.css";

/**
 * Layout dành cho phía Quản trị (Admin)
 * Cấu trúc: Sidebar bên trái, bên phải là Header và vùng nội dung chính
 */
export default function AdminLayout() {
  return (
    <div className={styles.adminContainer}>
      {/* Thanh điều hướng bên trái (thường chiếm 200-250px) */}
      <AdminSidebar />

      <div className={styles.adminBody}>
        {/* Thanh công cụ/thông tin phía trên */}
        <AdminHeader />
        
        {/* Vùng hiển thị nội dung các trang quản lý */}
        <main className={styles.mainContent}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}