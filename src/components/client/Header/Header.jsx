import { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/authContextValue";
import { CartContext } from "../../../context/cartContextValue";
import styles from "./Header.module.css";

export default function Header() {
  const { isAuthenticated, logout } = useContext(AuthContext);
  const { cartItems } = useContext(CartContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const isActive = (path) => location.pathname === path;
  const isCollection = location.pathname === "/products" && location.search === "?category=new";

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ""}`}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          LEANH <span>STUDIO</span>
        </Link>

        <nav className={styles.nav}>
          <Link
            to="/"
            className={`${styles.navLink} ${isActive("/") || isActive("/home") ? styles.active : ""}`}
          >
            Trang chủ
          </Link>

          <Link
            to="/products"
            className={`${styles.navLink} ${isActive("/products") && !isCollection ? styles.active : ""}`}
          >
            Cửa hàng
          </Link>

          <Link
            to="/products?category=new"
            className={`${styles.navLink} ${isCollection ? styles.active : ""}`}
          >
            Bộ sưu tập
          </Link>
        </nav>

        <div className={styles.actions}>
          <button className={styles.iconBtn}>
            TÌM KIẾM
          </button>

          <Link to={isAuthenticated ? "/profile" : "/auth"} className={styles.iconBtn}>
            {isAuthenticated ? "TÀI KHOẢN" : "ĐĂNG NHẬP"}
          </Link>

          <Link to={isAuthenticated ? "/cart" : "/auth"} className={styles.iconBtn}>
            GIỎ HÀNG
            <span className={styles.cartBadge}>{cartCount}</span>
          </Link>

          {isAuthenticated && (
            <button onClick={handleLogout} className={styles.logoutBtn}>
              ĐĂNG XUẤT
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
