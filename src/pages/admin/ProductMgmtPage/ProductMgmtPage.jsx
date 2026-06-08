import { useEffect, useMemo, useState } from "react";
import productApi from "../../../api/productApi";
import { getId, getList, getProductDisplayPrice, safeText } from "../adminPageUtils";
import styles from "../AdminPages.module.css";

export default function ProductMgmtPage() {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await productApi.getAll();
        setProducts(getList(res));
      } catch (err) {
        setError(err.message || "Không thể tải danh sách sản phẩm.");
      } finally {
        setLoading(false);
      }
    };

    void fetchProducts();
  }, []);

  const filteredProducts = useMemo(
    () => products.filter((product) => product.name?.toLowerCase().includes(query.toLowerCase())),
    [products, query],
  );

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Products</p>
          <h1>Quản lý sản phẩm</h1>
          <p>Kiểm tra danh sách sản phẩm, giá và tồn kho.</p>
        </div>
        <button className={styles.primaryBtn} type="button">Thêm sản phẩm</button>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2>Danh sách sản phẩm</h2>
          <input
            className={styles.searchInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm sản phẩm..."
          />
        </div>

        {loading && <div className={styles.loading}>Đang tải sản phẩm...</div>}
        {error && <div className={styles.error}>{error}</div>}
        {!loading && !error && filteredProducts.length === 0 && <div className={styles.empty}>Không có sản phẩm phù hợp.</div>}

        {!loading && !error && filteredProducts.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Tên sản phẩm</th>
                  <th>Danh mục</th>
                  <th>Giá</th>
                  <th>Tồn kho</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={getId(product)}>
                    <td className={styles.nameCell}>{product.name}</td>
                    <td>{safeText(product.categoryName || product.category?.name)}</td>
                    <td>{getProductDisplayPrice(product)}</td>
                    <td>{product.stock ?? product.quantity ?? 0}</td>
                    <td><span className={`${styles.status} ${styles.statusSuccess}`}>Đang bán</span></td>
                    <td>
                      <div className={styles.actionRow}>
                        <button className={styles.ghostBtn} type="button">Sửa</button>
                        <button className={styles.ghostBtn} type="button">Ẩn</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
