import { useState, useContext, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CartContext } from "../../../context/cartContextValue";
import { AuthContext } from "../../../context/authContextValue";
import styles from "./ProductDetailPage.module.css";
import productApi from "../../../api/productApi"; // Import API service
import {
  formatCurrency,
  getProductImage,
  getProductPrice,
  getResponseItem,
  getResponseList,
} from "../../../utils/productUtils";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("M");
  const [product, setProduct] = useState(null); // State để lưu thông tin sản phẩm từ API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("desc");

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        let response;
        try {
          response = await productApi.getBySlug(id);
        } catch {
          response = await productApi.getAll();
          const products = getResponseList(response);
          response = products.find((item) => String(item.id || item._id || item.slug) === String(id));
        }

        const data = getResponseItem(response); // Lấy data từ wrapper hoặc lấy trực tiếp response
        
        if (data && (data.id || data._id)) {
          setProduct(data);
          if (data.sizes?.length > 0) {
            setSelectedSize(data.sizes[0]);
          }
        } else {
          setError(response.message || "Không tìm thấy sản phẩm.");
        }
      } catch (err) {
        setError("Đã xảy ra lỗi khi tải chi tiết sản phẩm.");
        console.error("Error fetching product details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]); // Re-fetch khi ID sản phẩm thay đổi

  const handleAddToCart = async () => {
    if (!product) return; // Đảm bảo sản phẩm đã được tải
    if (!user) {
      navigate("/auth");
      return;
    }
    
    // Phải truyền đúng ID sản phẩm như CartContext mong đợi
    try {
      await addToCart(product.id || product._id, quantity);
      alert("Đã thêm sản phẩm vào giỏ hàng!");
    } catch {
      alert("Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.");
    }
  };

  if (loading) return <div className={styles.loading}>Đang tải chi tiết sản phẩm...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!product) return <div className={styles.noProduct}>Không tìm thấy sản phẩm này.</div>;

  return (
    <div className={styles.container}>
      <div className={styles.gallery}>
        <img src={getProductImage(product, "https://via.placeholder.com/600x800?text=No+Image")} alt={product.name} />
      </div>
      <div className={styles.details}>
        <span className={styles.category}>{product.categoryName || product.category?.name || "SẢN PHẨM"}</span>
        <h1>{product.name}</h1>
        <p className={styles.price}>{formatCurrency(getProductPrice(product))}</p>
        <div className={styles.divider} />
        
        <div className={styles.options}>
          <p className={styles.optionTitle}>KÍCH THƯỚC: {selectedSize}</p>
          <div className={styles.sizeGrid}>
            {(product.sizes || ["S", "M", "L", "XL"]).map(s => ( // Fallback nếu API không trả về sizes
              <button 
                key={s} 
                className={`${styles.sizeBtn} ${selectedSize === s ? styles.activeSize : ""}`}
                onClick={() => setSelectedSize(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.actions}>
          <div className={styles.qtyPicker}>
            <button onClick={() => setQuantity(q => Math.max(1, q-1))}>-</button>
            <span>{quantity}</span>
            <button onClick={() => setQuantity(q => q+1)}>+</button>
          </div>
          <button className={styles.addBtn} onClick={handleAddToCart}>
            THÊM VÀO GIỎ
          </button>
        </div>

        <div className={styles.infoTabs}>
          <div className={styles.tabHeaders}>
            <button className={activeTab === "desc" ? styles.activeTab : ""} onClick={() => setActiveTab("desc")}>Mô tả</button>
            <button className={activeTab === "ship" ? styles.activeTab : ""} onClick={() => setActiveTab("ship")}>Vận chuyển</button>
          </div>
          <div className={styles.tabContent}>
            {activeTab === "desc" ? (
              <p>{product.description || "Chưa có mô tả chi tiết cho sản phẩm này."}</p>
            ) : (
              <p>Giao hàng toàn quốc trong vòng 2-4 ngày làm việc. Miễn phí vận chuyển cho đơn hàng từ 1.000.000 VNĐ.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
