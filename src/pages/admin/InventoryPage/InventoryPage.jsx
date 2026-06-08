import { useEffect, useMemo, useState } from "react";
import productApi from "../../../api/productApi";
import { getId, getList, safeText } from "../adminPageUtils";
import styles from "../AdminPages.module.css";

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true);
      try {
        const res = await productApi.getAll();
        setProducts(getList(res));
      } finally {
        setLoading(false);
      }
    };

    void fetchInventory();
  }, []);

  const lowStockProducts = useMemo(
    () => products.filter((product) => Number(product.stock || product.quantity || 0) <= 5),
    [products],
  );

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Inventory</p>
          <h1>Quản lý kho hàng</h1>
          <p>Theo dõi tồn kho và các sản phẩm cần bổ sung.</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>Tổng SKU</p>
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
                  const stock = Number(product.stock || product.quantity || 0);
                  return (
                    <tr key={getId(product)}>
                      <td className={styles.nameCell}>{product.name}</td>
                      <td>{safeText(product.categoryName || product.category?.name)}</td>
                      <td>{stock}</td>
                      <td>
                        <span className={`${styles.status} ${stock <= 5 ? styles.statusDanger : styles.statusSuccess}`}>
                          {stock <= 5 ? "Cần nhập thêm" : "Ổn định"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
