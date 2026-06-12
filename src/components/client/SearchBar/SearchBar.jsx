import { useEffect, useRef, useState } from "react";
import styles from "./SearchBar.module.css";

export default function SearchBar({
  autoFocus = false,
  onSearch,
  placeholder = "Tìm kiếm sản phẩm...",
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch?.(query.trim());
  };

  return (
    <form className={styles.searchBar} onSubmit={handleSubmit} role="search">
      <input
        ref={inputRef}
        type="search"
        className={styles.input}
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button type="submit" className={styles.searchBtn} aria-label="Tìm kiếm">
        <span aria-hidden="true">⌕</span>
      </button>
    </form>
  );
}
