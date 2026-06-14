import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import categoryApi from "../../../api/categoryApi";
import productApi from "../../../api/productApi";
import {
  FALLBACK_PRODUCT_IMAGE,
  formatCurrency,
  getProductId,
  getProductImage,
  getProductPathId,
  getProductPrice,
  getResponseItem,
  getResponseList,
  matchesProductCategory,
  normalizeFilterValue,
  sortProductList,
} from "../../../utils/productUtils";
import styles from "./CollectionDetailPage.module.css";

const FALLBACK_COLLECTION = {
  name: "Bộ sưu tập",
  description: "Các sản phẩm thuộc bộ sưu tập này.",
};

const flattenCategories = (items = []) =>
  items.flatMap((category) => [category, ...flattenCategories(category.children || [])]);

const getCategoryName = (category) => category?.name || FALLBACK_COLLECTION.name;

const getCategoryDescription = (category) => category?.description || FALLBACK_COLLECTION.description;

const getCategoryMatchValues = (category) =>
  [category?.id, category?._id, category?.slug, category?.name]
    .filter((value) => value !== undefined && value !== null && value !== "")
    .map(normalizeFilterValue);

const getCollectionProductValues = (category, fallbackValue) => {
  const categories = category ? flattenCategories([category]) : [];
  const values = categories.flatMap(getCategoryMatchValues);

  if (fallbackValue) values.push(normalizeFilterValue(fallbackValue));

  return [...new Set(values)];
};

const findCategory = (categories, categoryValue) => {
  const normalizedValue = normalizeFilterValue(categoryValue);

  return flattenCategories(categories).find((category) =>
    getCategoryMatchValues(category).includes(normalizedValue),
  );
};

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

export default function CollectionDetailPage() {
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const [collection, setCollection] = useState(null);
  const [products, setProducts] = useState([]);
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCollectionProducts = async () => {
      setLoading(true);
      setError("");

      try {
        const [categoryDetailResult, categoryListResult, productResult] = await Promise.allSettled([
          categoryApi.getById(categoryId),
          categoryApi.getAll(),
          productApi.getAll(),
        ]);

        const categoryDetail =
          categoryDetailResult.status === "fulfilled" ? getResponseItem(categoryDetailResult.value) : null;
        const categories =
          categoryListResult.status === "fulfilled" ? getResponseList(categoryListResult.value) : [];
        const matchedCategory = findCategory(categories, categoryId) || categoryDetail;

        setCollection(matchedCategory || FALLBACK_COLLECTION);

        if (productResult.status !== "fulfilled") {
          throw productResult.reason;
        }

        const data = getResponseList(productResult.value);
        const categoryValues = getCollectionProductValues(matchedCategory, categoryId);
        const filteredProducts = data.filter((product) =>
            categoryValues.some((categoryValue) => matchesProductCategory(product, categoryValue)),
          );

        setProducts(await hydrateProductsWithImages(filteredProducts));
      } catch (err) {
        setError("Không thể tải sản phẩm trong bộ sưu tập này.");
        console.error("Error fetching collection products:", err);
      } finally {
        setLoading(false);
      }
    };

    void fetchCollectionProducts();
  }, [categoryId]);

  const displayedProducts = useMemo(() => sortProductList(products, sort), [products, sort]);

  return (
    <main className={styles.container}>
      <section className={styles.header}>
        <Link to="/collections" className={styles.backLink}>
          Quay lại bộ sưu tập
        </Link>
        <p className={styles.eyebrow}>LEANH STUDIO</p>
        <h1>{getCategoryName(collection)}</h1>
        <p>{getCategoryDescription(collection)}</p>
      </section>

      <div className={styles.topBar}>
        <p className={styles.count}>
          Hiển thị <span>{displayedProducts.length}</span> sản phẩm
        </p>
        <div className={styles.sort}>
          <span>Sắp xếp theo:</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
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
          <p>Chưa có sản phẩm nào trong bộ sưu tập này.</p>
          <Link to="/collections" className={styles.resetFilter}>
            Xem bộ sưu tập khác
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
              onKeyDown={(event) => {
                if (event.key === "Enter") {
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
    </main>
  );
}
