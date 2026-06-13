import { useEffect, useMemo, useState } from "react";
import productApi from "../../../api/productApi";
import { formatStock, getId, getList, getProductStock, safeText } from "../adminPageUtils";
import styles from "../AdminPages.module.css";

const fetchProductVariants = async (product) => {
  const productId = getId(product);
  if (!productId) return [];

  const attempts = [
    () => productApi.getVariantsById(productId),
    () => productApi.getVariants(productId),
  ];

  for (const attempt of attempts) {
    try {
      const variants = getList(await attempt());
      if (variants.length > 0) return variants;
    } catch {
      // Try the next supported variants route.
    }
  }

  return [];
};

const fetchProductList = async () => {
  const products = getList(await productApi.getAll());

  return Promise.all(
    products.map(async (product) => {
      if (getProductStock(product) !== null) return product;

      const variants = await fetchProductVariants(product);
      return variants.length > 0 ? { ...product, variants } : product;
    }),
  );
};

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailWarning, setDetailWarning] = useState("");

  useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true);
      setDetailWarning("");

      try {
        const productsWithStock = await fetchProductList();
        setProducts(productsWithStock);
        setDetailWarning(
          productsWithStock.some((product) => getProductStock(product) === null)
            ? "Một số sản phẩm chưa có dữ liệu tồn kho từ backend."
            : "",
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchInventory();
  }, []);

  const lowStockProducts = useMemo(
    () => products.filter((product) => {
      const stock = getProductStock(product);
      return stock !== null && stock <= 5;
    }),
    [products],
  );

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Inventory</p>
          <h1>Quản lý kho hàng</h1>
          <p>Theo dõi tồn kho lấy từ product variants.</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>Tổng sản phẩm</p>
          <h2 className={styles.statValue}>{products.length}</h2>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>Sắp hết hàng</p>
          <h2 className={styles.statValue}>{lowStockProducts.length}</h2>
        </article>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2>Tồn kho sản phẩm</h2>
        </div>

        {loading ? (
          <div className={styles.loading}>Đang tải tồn kho...</div>
        ) : (
          <>
            {detailWarning && <div className={styles.error}>{detailWarning}</div>}
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Danh mục</th>
                    <th>Tồn kho</th>
                    <th>Tình trạng</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const stock = getProductStock(product);
                    return (
                      <tr key={getId(product)}>
                        <td className={styles.nameCell}>{product.name}</td>
                        <td>{safeText(product.categoryName || product.category?.name)}</td>
                        <td>{formatStock(product)}</td>
                        <td>
                          <span className={`${styles.status} ${stock !== null && stock <= 5 ? styles.statusDanger : styles.statusSuccess}`}>
                            {stock === null ? "Không có dữ liệu" : stock <= 5 ? "Cần nhập thêm" : "Ổn định"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
