import { useCallback, useContext, useEffect, useState } from "react";
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
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    setIsSearchExpanded(false);
  }, [location.pathname]);

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

  const handleSearch = useCallback((query) => {
    const keyword = query.trim();

    if (!keyword) {
      setIsSearchExpanded(false);
      navigate("/products");
      return;
    }

    navigate(`/products?search=${encodeURIComponent(keyword)}`);
  }, [navigate]);

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header className={`${styles.header} ${isScrolled ? styles.scrolled : ""}`}>
        <div className={`${styles.container} ${isSearchExpanded ? styles.searchExpanded : ""}`}>
          <div className={styles.brandArea}>
            <Link to="/home" className={styles.logo}>
              <span className={styles.logoMain}>LEANH</span>
              <span className={styles.logoSub}>STUDIO</span>
            </Link>

            <div className={`${styles.searchField} ${isSearchExpanded ? styles.searchFieldOpen : ""}`}>
              <SearchBar
                autoFocus={isSearchExpanded}
                onBlur={(query) => {
                  if (!query) setIsSearchExpanded(false);
                }}
                onSearch={handleSearch}
                placeholder="Tìm kiếm sản phẩm..."
                searchOnChange
                showButton={false}
              />

              <button
                className={styles.searchToggle}
                type="button"
                aria-label="Mở tìm kiếm"
                aria-expanded={isSearchExpanded}
                onClick={() => setIsSearchExpanded(true)}
              >
                <span aria-hidden="true" />
              </button>
            </div>
          </div>

          <nav className={styles.nav}>
            <Link
              to="/home"
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

            <Link
              to="/vouchers"
              className={`${styles.navLink} ${isActive("/vouchers") ? styles.active : ""}`}
            >
              Ưu đãi
            </Link>
          </nav>

          <div className={styles.actions}>
            <button className={styles.iconBtn} type="button" aria-label="Thông báo">
              <span className={styles.headerIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
                  <path d="M10 20a2 2 0 0 0 4 0" />
                </svg>
              </span>
            </button>

            <Link to={isAuthenticated ? "/cart" : "/auth"} className={styles.iconBtn}>
              <span className={styles.headerIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path d="M6 8h12l-1 12H7L6 8Z" />
                  <path d="M9 8a3 3 0 0 1 6 0" />
                </svg>
              </span>
              <span className={styles.visuallyHidden}>Giỏ hàng</span>
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
