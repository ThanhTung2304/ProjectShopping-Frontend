import ProductCard from "../ProductCard/ProductCard";
import styles from "./ProductGrid.module.css";

export default function ProductGrid({ products = [] }) {
  return (
    <div className={styles.grid}>
      {products.map((product) => (
        <ProductCard key={product.id || product._id || product.slug} product={product} />
      ))}
    </div>
  );
}
