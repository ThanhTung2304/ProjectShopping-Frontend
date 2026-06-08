import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import categoryApi from "../../../api/categoryApi";
import styles from "./CollectionPage.module.css";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80";

const getCategoryFilterValue = (category) => category?.slug || category?.id || category?._id;

const getCategoryKey = (category, index) =>
  getCategoryFilterValue(category) || category?.name || `category-${index}`;

const getCategoryName = (category) => category?.name || "Bộ sưu tập";

const getCategoryImage = (category) =>
  category?.image || category?.img || category?.thumbnail || FALLBACK_IMAGE;

const getCategoryList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.content)) return response.data.content;
  if (Array.isArray(response?.content)) return response.content;
  return null;
};

export default function CollectionPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await categoryApi.getAll();
        const data = getCategoryList(response);

        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          setError(response?.message || "Không thể tải bộ sưu tập.");
        }
      } catch (err) {
        setError("Đã xảy ra lỗi khi tải bộ sưu tập.");
        console.error("Error fetching collections:", err);
      } finally {
        setLoading(false);
      }
    };

    void fetchCategories();
  }, []);

  const featuredCategory = categories[0];
  const otherCategories = useMemo(() => categories.slice(1), [categories]);

  const openCategory = (category) => {
    const categoryValue = getCategoryFilterValue(category);
    if (!categoryValue) return;

    navigate(`/products?category=${encodeURIComponent(categoryValue)}`);
  };

  return (
    <main className={styles.container}>
      <section className={styles.header}>
        <p className={styles.eyebrow}>LEANH STUDIO</p>
        <h1>Bộ sưu tập</h1>
        <p>
          Khám phá các nhóm phong cách riêng, từ trang phục tối giản hằng ngày
          đến những lựa chọn nổi bật cho mùa mới.
        </p>
      </section>

      {loading && <div className={styles.loading}>Đang tải bộ sưu tập...</div>}
      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && categories.length === 0 && (
        <div className={styles.empty}>Chưa có bộ sưu tập nào.</div>
      )}

      {!loading && !error && featuredCategory && (
        <>
          <button
            className={styles.featured}
            type="button"
            onClick={() => openCategory(featuredCategory)}
          >
            <img src={getCategoryImage(featuredCategory)} alt={getCategoryName(featuredCategory)} />
            <span className={styles.featuredContent}>
              <span className={styles.featuredLabel}>Nổi bật</span>
              <strong>{getCategoryName(featuredCategory)}</strong>
              <span>{featuredCategory.description || "Xem các sản phẩm trong bộ sưu tập này."}</span>
            </span>
          </button>

          <section className={styles.grid}>
            {otherCategories.map((category, index) => (
              <button
                key={getCategoryKey(category, index)}
                className={styles.card}
                type="button"
                onClick={() => openCategory(category)}
              >
                <img src={getCategoryImage(category)} alt={getCategoryName(category)} />
                <span className={styles.cardBody}>
                  <span>{getCategoryName(category)}</span>
                  <small>{category.description || "Xem sản phẩm"}</small>
                </span>
              </button>
            ))}
          </section>
        </>
      )}
    </main>
  );
}
