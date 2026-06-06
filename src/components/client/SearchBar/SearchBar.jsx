import { useState } from "react";
import styles from "./SearchBar.module.css";

/**
 * SearchBar Component
 * @param {Function} onSearch - Hàm xử lý khi người dùng submit tìm kiếm
 * @param {string} placeholder - Nội dung gợi ý trong ô input
 */
export default function SearchBar({ onSearch, placeholder = "Tìm kiếm sản phẩm..." }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query.trim());
    }
  };

  return (
    <form className={styles.searchBar} onSubmit={handleSubmit}>
      <input
        type="text"
        className={styles.input}
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button type="submit" className={styles.searchBtn} aria-label="Search">
        <i className="ri-search-line"></i>
      </button>
    </form>
  );
}
