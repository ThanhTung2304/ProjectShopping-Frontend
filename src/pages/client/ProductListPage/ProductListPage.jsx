import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import productApi from "../../../api/productApi";
import {
  formatCurrency,
  getProductId,
  getProductImage,
  getProductPathId,
  getProductPrice,
  getResponseList,
} from "../../../utils/productUtils";
import styles from "./ProductListPage.module.css";

export default function ProductListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentCategory = searchParams.get("category") || "all";
  const currentSort = searchParams.get("sort") || "newest";

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await productApi.getAll({
          category: currentCategory === "all" ? undefined : currentCategory,
          sort: currentSort,
        });
        const data = getResponseList(response);

        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          setError(response?.message || "Không thể tải sản phẩm.");
        }
      } catch (err) {
        setError("Đã xảy ra lỗi khi tải sản phẩm.");
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };

    void fetchProducts();
  }, [currentCategory, currentSort]);

  const handleSortChange = (e) => {
    setSearchParams({ category: currentCategory, sort: e.target.value });
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.topBar}>
          <p className={styles.count}>
            Hiển thị <span>{products.length}</span> sản phẩm
          </p>
          <div className={styles.sort}>
            <span>Sắp xếp theo:</span>
            <select value={currentSort} onChange={handleSortChange}>
              <option value="newest">Mới nhất</option>
              <option value="price_asc">Giá: Thấp đến Cao</option>
              <option value="price_desc">Giá: Cao đến Thấp</option>
            </select>
          </div>
        </div>

        {loading && <div className={styles.loading}>Đang tải sản phẩm...</div>}
        {error && <div className={styles.error}>{error}</div>}

        {!loading && !error && products.length === 0 && (
          <div className={styles.noProducts}>
            <p>Không tìm thấy sản phẩm nào.</p>
            <Link to="/products" className={styles.resetFilter}>
              Xóa bộ lọc
            </Link>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className={styles.grid}>
            {products.map((product) => (
              <div
                key={getProductId(product)}
                className={styles.card}
                onClick={() => navigate(`/products/${getProductPathId(product)}`)}
              >
                <div className={styles.imageBox}>
                  <img src={getProductImage(product)} alt={product.name} />
                  <div className={styles.overlay}>Xem chi tiết</div>
                </div>
                <div className={styles.info}>
                  <h3>{product.name}</h3>
                  <p>{formatCurrency(getProductPrice(product))}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
