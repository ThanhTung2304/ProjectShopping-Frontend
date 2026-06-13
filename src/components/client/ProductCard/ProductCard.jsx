import { Link } from "react-router-dom";
import styles from "./ProductCard.module.css";
import { FALLBACK_PRODUCT_IMAGE, formatCurrency, getProductImage, getProductPathId, getProductPrice } from "../../../utils/productUtils";

export default function ProductCard({ product }) {
  const { name, category, categoryName } = product;
  const productPath = `/products/${getProductPathId(product)}`;
  const thumbnail = getProductImage(product);

  return (
    <div className={styles.card}>
      
      <div className={styles.imageWrapper}>
        <Link to={productPath}>
          <img
            src={thumbnail}
            alt={name}
            className={styles.image}
            onError={(event) => {
              event.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
            }}
          />
        </Link>
        <button className={styles.quickAdd}>Thêm vào giỏ</button>
      </div>

      <div className={styles.info}>
        <span className={styles.category}>{category?.name || categoryName}</span>
        <Link to={productPath} className={styles.name}>
          {name}
        </Link>
        <div className={styles.price}>
          {formatCurrency(getProductPrice(product))}
        </div>
      </div>
    </div>
  );
}
