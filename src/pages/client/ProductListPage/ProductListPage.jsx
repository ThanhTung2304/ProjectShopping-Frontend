import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import productApi from "../../../api/productApi";
import {
  formatCurrency,
  FALLBACK_PRODUCT_IMAGE,
  getProductId,
  getProductImage,
  getProductPathId,
  getProductPrice,
  getResponseItem,
  getResponseList,
  matchesProductCategory,
  sortProductList,
} from "../../../utils/productUtils";
import styles from "./ProductListPage.module.css";

const getProductSearchText = (product) =>
  [
    product?.name,
    product?.description,
    product?.shortDescription,
    product?.category?.name,
    product?.categoryName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const hydrateProductsWithImages = async (items) =>
  Promise.all(
    items.map(async (product) => {
      if (Array.isArray(product?.images) && product.images.length > 0) return product;

      try {
        const detail = getResponseItem(await productApi.getById(getProductId(product)));
        return detail ? { ...product, ...detail } : product;
      } catch {
        return product;
      }
    }),
  );

export default function ProductListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentCategory = searchParams.get("category") || "all";
  const currentSort = searchParams.get("sort") || "newest";
  const currentSearch = (searchParams.get("search") || "").trim();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await productApi.getAll({
          category: currentCategory === "all" ? undefined : currentCategory,
          categoryId: currentCategory === "all" ? undefined : currentCategory,
          sort: currentSort,
          search: currentSearch || undefined,
        });
        const data = getResponseList(response);

        if (Array.isArray(data)) {
          setProducts(await hydrateProductsWithImages(data));
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
  }, [currentCategory, currentSearch, currentSort]);

  const displayedProducts = useMemo(() => {
    const categoryProducts = products.filter((product) => matchesProductCategory(product, currentCategory));

    if (!currentSearch) return sortProductList(categoryProducts, currentSort);

    const keyword = currentSearch.toLowerCase();
    return sortProductList(
      categoryProducts.filter((product) => getProductSearchText(product).includes(keyword)),
      currentSort,
    );
  }, [currentCategory, currentSearch, currentSort, products]);

  const updateParams = (nextValues) => {
    const params = new URLSearchParams(searchParams);

    Object.entries(nextValues).forEach(([key, value]) => {
      if (!value || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    setSearchParams(params);
  };

  const handleSortChange = (e) => {
    updateParams({ sort: e.target.value });
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.topBar}>
          <div>
            <p className={styles.count}>
              Hiển thị <span>{displayedProducts.length}</span> sản phẩm
            </p>
            {currentSearch && (
              <p className={styles.searchSummary}>
                Kết quả cho <strong>{currentSearch}</strong>
              </p>
            )}
          </div>
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

        {!loading && !error && displayedProducts.length === 0 && (
          <div className={styles.noProducts}>
            <p>Không tìm thấy sản phẩm nào.</p>
            <Link to="/products" className={styles.resetFilter}>
              Xóa bộ lọc
            </Link>
          </div>
        )}

        {!loading && !error && displayedProducts.length > 0 && (
          <div className={styles.grid}>
            {displayedProducts.map((product) => (
              <div
                key={getProductId(product)}
                className={styles.card}
                onClick={() => navigate(`/products/${getProductPathId(product)}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    navigate(`/products/${getProductPathId(product)}`);
                  }
                }}
              >
                <div className={styles.imageBox}>
                  <img
                    src={getProductImage(product)}
                    alt={product.name}
                    onError={(event) => {
                      event.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                    }}
                  />
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
