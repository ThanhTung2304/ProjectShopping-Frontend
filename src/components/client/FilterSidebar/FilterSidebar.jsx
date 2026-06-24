import styles from "./FilterSidebar.module.css";

/**
 * FilterSidebar Component
 * @param {Array} categories - Danh sách danh mục từ API
 * @param {Object} filters - Trạng thái lọc hiện tại
 * @param {Function} onFilterChange - Hàm xử lý khi thay đổi bộ lọc
 */
export default function FilterSidebar({ categories = [], filters, onFilterChange }) {
  const sizes = [
    "S", "M", "L", "XL", "XXL",
    "28", "29", "30", "31", "32", "33", "34",
    "35", "36", "37", "38", "39", "40", "41", "42", "43", "44",
    "FREE_SIZE",
  ];
  const colors = [
    { name: "Black", hex: "#000000" },
    { name: "White", hex: "#ffffff" },
    { name: "Grey", hex: "#808080" },
    { name: "Beige", hex: "#f5f5dc" },
  ];

  const handleCategoryClick = (categoryId) => {
    onFilterChange({ ...filters, categoryId: filters.categoryId === categoryId ? "" : categoryId });
  };

  const handleSizeClick = (size) => {
    onFilterChange({ ...filters, size: filters.size === size ? "" : size });
  };

  const handleColorClick = (colorName) => {
    onFilterChange({ ...filters, color: filters.color === colorName ? "" : colorName });
  };

  return (
    <aside className={styles.sidebar}>
      {/* Categories Section */}
      <div className={styles.section}>
        <h3 className={styles.title}>Danh mục</h3>
        <ul className={styles.list}>
          {categories.map((cat) => (
            <li 
              key={cat.id} 
              className={`${styles.listItem} ${filters.categoryId === cat.id ? styles.active : ""}`}
              onClick={() => handleCategoryClick(cat.id)}
            >
              {cat.name}
            </li>
          ))}
        </ul>
      </div>

      {/* Price Section */}
      <div className={styles.section}>
        <h3 className={styles.title}>Khoảng giá (VNĐ)</h3>
        <div className={styles.priceInputs}>
          <input 
            type="number" 
            placeholder="Từ" 
            value={filters.minPrice || ""} 
            onChange={(e) => onFilterChange({ ...filters, minPrice: e.target.value })}
          />
          <span>-</span>
          <input 
            type="number" 
            placeholder="Đến" 
            value={filters.maxPrice || ""} 
            onChange={(e) => onFilterChange({ ...filters, maxPrice: e.target.value })}
          />
        </div>
      </div>

      {/* Color Section */}
      <div className={styles.section}>
        <h3 className={styles.title}>Màu sắc</h3>
        <div className={styles.colorGrid}>
          {colors.map((c) => (
            <div 
              key={c.name} 
              className={`${styles.colorCircle} ${filters.color === c.name ? styles.colorActive : ""}`}
              style={{ backgroundColor: c.hex }}
              title={c.name}
              onClick={() => handleColorClick(c.name)}
            />
          ))}
        </div>
      </div>

      {/* Size Section */}
      <div className={styles.section}>
        <h3 className={styles.title}>Kích cỡ</h3>
        <div className={styles.sizeGrid}>
          {sizes.map((s) => (
            <button 
              key={s} 
              className={`${styles.sizeBtn} ${filters.size === s ? styles.sizeActive : ""}`}
              onClick={() => handleSizeClick(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <button 
        className={styles.clearBtn}
        onClick={() => onFilterChange({ categoryId: "", minPrice: "", maxPrice: "", size: "", color: "" })}
      >
        Xóa tất cả bộ lọc
      </button>
    </aside>
  );
}
