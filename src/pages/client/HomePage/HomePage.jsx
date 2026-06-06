import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./HomePage.module.css";
import productApi from "../../../api/productApi"; // Import API service
import {
  formatCurrency,
  getProductId,
  getProductImage,
  getProductPathId,
  getProductPrice,
  getResponseList,
} from "../../../utils/productUtils";

export default function HomePage() {
  const navigate = useNavigate();
  const cardRefs = useRef([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        // Gọi API để lấy các sản phẩm nổi bật
        // Giả định backend hỗ trợ filter theo 'featured=true'
        const response = await productApi.getAll({ featured: true, limit: 4 }); // Lấy 4 sản phẩm nổi bật
        
        const data = getResponseList(response);
        if (Array.isArray(data)) {
          setFeaturedProducts(data);
        } else {
          setError(response.message || "Không thể tải sản phẩm nổi bật.");
        }
      } catch (err) {
        setError("Đã xảy ra lỗi khi tải sản phẩm nổi bật.");
        console.error("Error fetching featured products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  useEffect(() => {
    // Chỉ chạy hiệu ứng IntersectionObserver khi có sản phẩm
    if (featuredProducts.length === 0 && !loading) return;

    // Tạo bản sao của mảng ref hiện tại để tránh thay đổi trong quá trình quan sát
    const currentCards = [...cardRefs.current];
    const observers = currentCards.map((card, i) => {
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
  }, [featuredProducts, loading]); // Re-run khi featuredProducts thay đổi

  return (
    <div className={styles.root}>
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

        {loading && <div className={styles.loading}>Đang tải sản phẩm nổi bật...</div>}
        {error && <div className={styles.error}>{error}</div>}

        {!loading && !error && featuredProducts.length === 0 && (
          <div className={styles.noProducts}>Không tìm thấy sản phẩm nổi bật nào.</div>
        )}

        {!loading && !error && featuredProducts.length > 0 && (
          <div className={styles.productGrid}>
            {featuredProducts.map((product, i) => (
              <div
                key={getProductId(product)}
                className={styles.card}
                ref={(el) => {
                  if (el) cardRefs.current[i] = el;
                }}
                onClick={() => navigate(`/products/${getProductPathId(product)}`)}
              >
                <div className={styles.imageContainer}>
                  <img src={getProductImage(product)} alt={product.name} />
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
                  <p className={styles.cardTag}>{product.tag || product.categoryName || "Chưa phân loại"}</p>
                  <h3>{product.name}</h3>
                  <div className={styles.priceRow}>
                    <p className={styles.price}>{formatCurrency(getProductPrice(product))}</p>
                    {product.oldPrice && (
                      <span className={styles.oldPrice}>{product.oldPrice?.toLocaleString()} VNĐ</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
