import { useEffect, useRef, useState } from "react";
import styles from "./SearchBar.module.css";

export default function SearchBar({
  autoFocus = false,
  onBlur,
  onSearch,
  placeholder = "Tìm kiếm sản phẩm...",
  searchOnChange = false,
  showButton = true,
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const searchTimerRef = useRef(null);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    return () => {
      window.clearTimeout(searchTimerRef.current);
    };
  }, []);

  const clearSearchTimer = () => {
    window.clearTimeout(searchTimerRef.current);
  };

  const handleChange = (e) => {
    const nextQuery = e.target.value;
    setQuery(nextQuery);

    if (!searchOnChange) return;

    clearSearchTimer();
    searchTimerRef.current = window.setTimeout(() => {
      onSearch?.(nextQuery.trim());
    }, 300);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    clearSearchTimer();
    onSearch?.(query.trim());
  };

  const handleBlur = () => {
    clearSearchTimer();
    onBlur?.(query.trim());
  };

  return (
    <form className={styles.searchBar} onSubmit={handleSubmit} role="search">
      <input
        ref={inputRef}
        type="search"
        className={styles.input}
        placeholder={placeholder}
        value={query}
        onBlur={handleBlur}
        onChange={handleChange}
      />

      <button
        type="button"
        className={styles.clearBtn}
        onClick={() => {
          setQuery("");
          onSearch?.("");
          onBlur?.("");
          inputRef.current?.blur();
        }}
        aria-label="Đóng tìm kiếm"
      >
        ×
      </button>

      {showButton && (
        <button
          type="submit"
          className={styles.searchBtn}
          aria-label="Tìm kiếm"
        >
          <span aria-hidden="true">⌕</span>
        </button>
      )}
    </form>
  );
}
