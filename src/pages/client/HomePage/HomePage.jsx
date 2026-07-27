import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./HomePage.module.css";
import productApi from "../../../api/productApi";
import {
  formatCurrency,
  FALLBACK_PRODUCT_IMAGE,
  getProductId,
  getProductImage,
  getProductPathId,
  getProductPrice,
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
        const response = await productApi.getFeatured();
        setFeaturedProducts(response?.data || []);
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
    if (featuredProducts.length === 0 && !loading) return;

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
  }, [featuredProducts, loading]);

  return (
    <div className={styles.root}>
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
            src="https://scontent.fthd2-4.fna.fbcdn.net/v/t39.30808-6/641253086_1478294117637818_7335049322730579437_n.jpg?stp=dst-jpg_tt6&cstp=mx960x960&ctp=s960x960&_nc_cat=108&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeF7_eja9HQKDya5FKeBFxtEpVTojgb6uBKlVOiOBvq4EnAI_oQgsWHRg9ubkaPf2xuoZppa_qWdsQArQDZuWy4C&_nc_ohc=UN_ksF-DkWIQ7kNvwGpQ9_7&_nc_oc=AdrLZx-tz24yZvCwqjz5XH8VRtyWl7OFZrtx57Sw_oL8L_6f7eNPWEq5QtpJRDZA-93iwFVwNJTUFpKl1tTNNnhy&_nc_zt=23&_nc_ht=scontent.fthd2-4.fna&_nc_gid=FlE3Okb9wtJ0Su51ZskDUQ&_nc_ss=7b2a8&oh=00_AQAdLl6e1VunKE3Dx6BZhFgLbn2s5TeCzmsMMYcPFrFKWg&oe=6A6D185B"
            alt="Hero fashion"
          />
        </div>
      </section>

      <section className={styles.products}>
        <div className={styles.sectionHeader}>
          <h2>Sản phẩm nổi bật</h2>
          <button className={styles.seeAllBtn} onClick={() => navigate("/products")}>
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
                  <img
                    src={getProductImage(product)}
                    alt={product.name}
                    onError={(event) => {
                      event.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                    }}
                  />
                  <span className={styles.featuredBadge}>Nổi bật</span>
                  <button
                    className={styles.quickAdd}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    + Thêm vào giỏ
                  </button>
                </div>

                <div className={styles.cardBody}>
                  <p className={styles.cardTag}>{product.categoryName || "Chưa phân loại"}</p>
                  <h3>{product.name}</h3>
                  <div className={styles.priceRow}>
                    <p className={styles.price}>{formatCurrency(getProductPrice(product))}</p>
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