  // import styles from "./HomePage.module.css";
  // import { useNavigate } from "react-router-dom";

  // export default function HomePage() {

  //   const navigate = useNavigate();

  //   return (
  //     <div className={styles.root}>

  //       {/* Navbar */}
  //       <header className={styles.navbar}>

  //         {/* Logo */}
  //         <div
  //           className={styles.logo}
  //           onClick={() => navigate("/home")}
  //         >
  //           LeAnh <span>Studio</span>
  //         </div>

  //         {/* Navigation */}
  //         <nav className={styles.navLinks}>

  //           <button onClick={() => navigate("/home")}>
  //             Trang chủ
  //           </button>

  //           <button onClick={() => navigate("/products")}>
  //             Sản phẩm
  //           </button>

  //           <button onClick={() => navigate("/collections")}>
  //             Bộ sưu tập
  //           </button>

  //           <button>
  //             Tài khoản
  //           </button>

  //           <button>
  //             Đơn hàng
  //           </button>

  //         </nav>

  //         {/* Right actions */}
  //         <div className={styles.actions}>

  //           <button className={styles.cartBtn}>
  //             Giỏ hàng
  //           </button>

  //           <button
  //             className={styles.logoutBtn}
  //             onClick={() => {
  //               localStorage.removeItem("token");
  //               navigate("/");
  //             }}
  //           >
  //             Đăng xuất
  //           </button>

  //         </div>

  //       </header>

  //       {/* Hero */}
  //       <section className={styles.hero}>

  //         <div className={styles.heroContent}>

  //           <p className={styles.subtitle}>
  //             NEW COLLECTION 2026
  //           </p>

  //           <h1>
  //             Thời trang nâng tầm
  //             <br />
  //             phong cách hiện đại
  //           </h1>

  //           <p className={styles.desc}>
  //             Khám phá bộ sưu tập thời trang cao cấp dành cho giới trẻ yêu thích
  //             phong cách tối giản và sang trọng.
  //           </p>

  //           <button className={styles.shopBtn}>
  //             Mua ngay
  //           </button>

  //         </div>

  //         <div className={styles.heroImage}>
  //           <img
  //             src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b"
  //             alt=""
  //           />
  //         </div>

  //       </section>

  //     </div>
  //   );
  // }


import styles from "./HomePage.module.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";

const PRODUCTS = [
  {
    id: 1,
    name: "Áo Blazer Trắng Tinh",
    tag: "Áo khoác",
    price: "1.290.000đ",
    oldPrice: "1.590.000đ",
    featured: true,
    img: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80",
  },
  {
    id: 2,
    name: "Váy Midi Lụa Nhẹ",
    tag: "Váy",
    price: "890.000đ",
    oldPrice: null,
    featured: false,
    img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80",
  },
  {
    id: 3,
    name: "Quần Palazzo Đen",
    tag: "Quần",
    price: "750.000đ",
    oldPrice: "950.000đ",
    featured: false,
    img: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80",
  },
  {
    id: 4,
    name: "Áo Croptop Kem",
    tag: "Áo",
    price: "490.000đ",
    oldPrice: null,
    featured: true,
    img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80",
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const cardRefs = useRef([]);

  useEffect(() => {
    const observers = cardRefs.current.map((card, i) => {
      if (!card) return null;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              card.classList.add(styles.visible);
            }, i * 120);
            observer.disconnect();
          }
        },
        { threshold: 0.15 }
      );
      observer.observe(card);
      return observer;
    });

    return () => observers.forEach((obs) => obs && obs.disconnect());
  }, []);

  return (
    <div className={styles.root}>

      {/* Navbar */}
      <header className={styles.navbar}>
        <div className={styles.logo} onClick={() => navigate("/home")}>
          LeAnh <span>Studio</span>
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

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.subtitle}>NEW COLLECTION 2026</p>
          <h1>
            Thời trang nâng tầm
            <br />
            phong cách hiện đại
          </h1>
          <p className={styles.desc}>
            Khám phá bộ sưu tập thời trang cao cấp dành cho giới trẻ yêu thích
            phong cách tối giản và sang trọng.
          </p>
          <button className={styles.shopBtn}>Mua ngay</button>
        </div>

        <div className={styles.heroImage}>
          <img
            src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b"
            alt="Hero fashion"
          />
        </div>
      </section>

      {/* Featured Products */}
      <section className={styles.products}>
        <div className={styles.sectionHeader}>
          <h2>Sản phẩm nổi bật</h2>
          <button
            className={styles.seeAllBtn}
            onClick={() => navigate("/products")}
          >
            Xem tất cả →
          </button>
        </div>

        <div className={styles.productGrid}>
          {PRODUCTS.map((product, i) => (
            <div
              key={product.id}
              className={styles.card}
              ref={(el) => (cardRefs.current[i] = el)}
              onClick={() => navigate(`/products/${product.id}`)}
            >
              <div className={styles.imageContainer}>
                <img src={product.img} alt={product.name} />
                {product.featured && (
                  <span className={styles.featuredBadge}>Nổi bật</span>
                )}
                <button
                  className={styles.quickAdd}
                  onClick={(e) => {
                    e.stopPropagation();
                    // handle add to cart
                  }}
                >
                  + Thêm vào giỏ
                </button>
              </div>

              <div className={styles.cardBody}>
                <p className={styles.cardTag}>{product.tag}</p>
                <h3>{product.name}</h3>
                <div className={styles.priceRow}>
                  <p className={styles.price}>{product.price}</p>
                  {product.oldPrice && (
                    <span className={styles.oldPrice}>{product.oldPrice}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}