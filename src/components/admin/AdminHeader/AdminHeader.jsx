import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/authContextValue";
import styles from "./AdminHeader.module.css";

export default function AdminHeader() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  return (
    <header className={styles.header}>
      <div className={styles.breadcrumb}>
        <span>Trang quản trị</span>
        <i className="ri-arrow-right-s-line"></i>
        <span className={styles.current}>Bảng điều khiển</span>
      </div>

      <div className={styles.actions}>
        <div className={styles.userInfo}>
          <p className={styles.name}>{user?.fullName || "Admin"}</p>
          <span className={styles.role}>Quản trị viên</span>
        </div>
        
        <div className={styles.divider}></div>

        <button onClick={handleLogout} className={styles.logoutBtn} title="Đăng xuất">
          <i className="ri-logout-box-r-line"></i>
        </button>
      </div>
    </header>
  );
}
