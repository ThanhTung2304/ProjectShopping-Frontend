import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import styles from "./ProductListPage.module.css";
import productApi from "../../../api/productApi"; // Import API service
import {
  formatCurrency,
  getProductId,
  getProductImage,
  getProductPathId,
  getProductPrice,
  getResponseList,
} from "../../../utils/productUtils";

const CATEGORIES = [
  { id: "all", label: "Tất cả" },
  { id: "jacket", label: "Áo khoác" },
  { id: "dress", label: "Váy" },
  { id: "pants", label: "Quần" },
  { id: "top", label: "Áo sơ mi" },
];

export default function ProductListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentCategory = searchParams.get("category") || "all"; // Lấy category từ URL
  const currentSort = searchParams.get("sort") || "newest"; // Lấy sort từ URL

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {
          category: currentCategory === "all" ? undefined : currentCategory,
          sort: currentSort,
        };
        const response = await productApi.getAll(params);

        const data = getResponseList(response);
        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          setError(response.message || "Không thể tải sản phẩm.");
        }
      } catch (err) {
        setError("Đã xảy ra lỗi khi tải sản phẩm.");
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentCategory, currentSort]); // Re-fetch khi category hoặc sort thay đổi

  const handleCategoryChange = (catId) => {
    setSearchParams({ category: catId, sort: currentSort });
  };

  const handleSortChange = (e) => {
    setSearchParams({ category: currentCategory, sort: e.target.value });
  };

  return (
    <div className={styles.container}>
      {/* Sidebar Filters */}
      <aside className={styles.sidebar}>
        <div className={styles.filterSection}>
          <h3>DANH MỤC</h3>
          <ul className={styles.catList}>
            {CATEGORIES.map(cat => (
              <li 
                key={cat.id} 
                className={`${styles.catItem} ${currentCategory === cat.id ? styles.activeCat : ""}`}
                onClick={() => handleCategoryChange(cat.id)}
              >
                {cat.label}
              </li>
            ))}
          </ul>
          {/* Thêm các bộ lọc khác như giá, màu sắc, thương hiệu ở đây */}
        </div>
      </aside>

      <div className={styles.content}>
        <div className={styles.topBar}>
          <p className={styles.count}>Hiển thị <span>{products.length}</span> sản phẩm</p>
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
            <Link to="/products" className={styles.resetFilter}>Xóa bộ lọc</Link>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className={styles.grid}>
            {products.map((p) => (
            <div 
              key={getProductId(p)}
              className={styles.card}
              onClick={() => navigate(`/products/${getProductPathId(p)}`)}
            >
              <div className={styles.imageBox}>
                {/* Fallback cho cả img và image */}
                <img src={getProductImage(p)} alt={p.name} />
                <div className={styles.overlay}>Xem chi tiết</div>
              </div>
              <div className={styles.info}>
                <h3>{p.name}</h3>
                <p>{formatCurrency(getProductPrice(p))}</p>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}
