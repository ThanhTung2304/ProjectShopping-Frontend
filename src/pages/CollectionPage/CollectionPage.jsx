import styles from "./CollectionPage.module.css";
import { useNavigate } from "react-router-dom";

export default function CollectionPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.root}>
      <header className={styles.navbar}>
        <div
          className={styles.logo}
          onClick={() => navigate("/home")}
        >
          LA <span>Studio</span>
        </div>

        <nav className={styles.navLinks}>
          <button onClick={() => navigate("/home")}>Trang chủ</button>
          <button onClick={() => navigate("/products")}>Sản phẩm</button>
          <button onClick={() => navigate("/collections")}>Bộ sưu tập</button>
          <button>Tài khoản</button>
          <button>Đơn hàng</button>
        </nav>

        <div className={styles.actions}>
          <button className={styles.cartBtn}>Giỏ hàng</button>

          <button
            className={styles.logoutBtn}
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/");
            }}
          >
            Đăng xuất
          </button>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>Bộ sưu tập thời trang</h1>
        </div>
      </section>
    </div>
  );
}