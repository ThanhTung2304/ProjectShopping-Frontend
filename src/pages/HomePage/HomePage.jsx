import styles from "./HomePage.module.css";
import { useNavigate } from "react-router-dom";

export default function HomePage() {

  const navigate = useNavigate();

  return (
    <div className={styles.root}>

      {/* Navbar */}
      <header className={styles.navbar}>

        {/* Logo */}
        <div
          className={styles.logo}
          onClick={() => navigate("/home")}
        >
          LA <span>Studio</span>
        </div>

        {/* Navigation */}
        <nav className={styles.navLinks}>

          <button onClick={() => navigate("/home")}>
            Trang chủ
          </button>

          <button onClick={() => navigate("/products")}>
            Sản phẩm
          </button>

          <button onClick={() => navigate("/collections")}>
            Bộ sưu tập
          </button>

          <button>
            Tài khoản
          </button>

          <button>
            Đơn hàng
          </button>

        </nav>

        {/* Right actions */}
        <div className={styles.actions}>

          <button className={styles.cartBtn}>
            Giỏ hàng
          </button>

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

      {/* Hero */}
      <section className={styles.hero}>

        <div className={styles.heroContent}>

          <p className={styles.subtitle}>
            NEW COLLECTION 2026
          </p>

          <h1>
            Thời trang nâng tầm
            <br />
            phong cách hiện đại
          </h1>

          <p className={styles.desc}>
            Khám phá bộ sưu tập thời trang cao cấp dành cho giới trẻ yêu thích
            phong cách tối giản và sang trọng.
          </p>

          <button className={styles.shopBtn}>
            Mua ngay
          </button>

        </div>

        <div className={styles.heroImage}>
          <img
            src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b"
            alt=""
          />
        </div>

      </section>

    </div>
  );
}