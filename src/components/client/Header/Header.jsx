import { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/authContextValue";
import { CartContext } from "../../../context/cartContextValue";
import SearchBar from "../SearchBar/SearchBar";
import styles from "./Header.module.css";

export default function Header() {
  const { isAuthenticated, logout } = useContext(AuthContext);
  const { cartItems } = useContext(CartContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    setIsSidebarOpen(false);
    setIsSearchOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  const handleLogout = () => {
    logout();
    setIsSidebarOpen(false);
    navigate("/");
  };

  const handleSearch = (query) => {
    const keyword = query.trim();
    setIsSearchOpen(false);

    if (!keyword) {
      navigate("/products");
      return;
    }

    navigate(`/products?search=${encodeURIComponent(keyword)}`);
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const isActive = (path) => location.pathname === path;

  return (
    <>
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
              className={`${styles.navLink} ${isActive("/products") ? styles.active : ""}`}
            >
              Cửa hàng
            </Link>

            <Link
              to="/collections"
              className={`${styles.navLink} ${isActive("/collections") ? styles.active : ""}`}
            >
              Bộ sưu tập
            </Link>
          </nav>

          <div className={styles.actions}>
            <div className={styles.searchAction}>
              <button
                className={styles.iconBtn}
                type="button"
                aria-expanded={isSearchOpen}
                onClick={() => setIsSearchOpen((value) => !value)}
              >
                Tìm kiếm
              </button>

              <div className={`${styles.searchPanel} ${isSearchOpen ? styles.searchPanelOpen : ""}`}>
                <SearchBar onSearch={handleSearch} autoFocus placeholder="Tìm kiếm sản phẩm..." />
              </div>
            </div>

            <Link to={isAuthenticated ? "/cart" : "/auth"} className={styles.iconBtn}>
              Giỏ hàng
              <span className={styles.cartBadge}>{cartCount}</span>
            </Link>

            <button
              className={styles.menuBtn}
              type="button"
              aria-label="Mở menu tài khoản"
              aria-expanded={isSidebarOpen}
              onClick={() => setIsSidebarOpen(true)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <button
        className={`${styles.overlay} ${isSidebarOpen ? styles.overlayOpen : ""}`}
        type="button"
        aria-label="Đóng menu"
        onClick={() => setIsSidebarOpen(false)}
      />

      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ""}`} aria-hidden={!isSidebarOpen}>
        <div className={styles.sidebarHeader}>
          <div>
            <p className={styles.sidebarEyebrow}>LEANH STUDIO</p>
            <h2>Tài khoản</h2>
          </div>
          <button
            className={styles.closeBtn}
            type="button"
            aria-label="Đóng menu"
            onClick={() => setIsSidebarOpen(false)}
          >
            x
          </button>
        </div>

        <div className={styles.sidebarActions}>
          <Link to={isAuthenticated ? "/profile" : "/auth"} className={styles.sidebarAction}>
            {isAuthenticated ? "Tài khoản" : "Đăng nhập"}
          </Link>

          {isAuthenticated && (
            <button className={styles.sidebarLogout} type="button" onClick={handleLogout}>
              Đăng xuất
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
