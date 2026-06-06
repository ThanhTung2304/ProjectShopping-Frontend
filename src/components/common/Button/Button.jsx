import styles from "./Button.module.css";

export default function Button({ 
  children, 
  type = "button", 
  variant = "primary", 
  loading = false, 
  disabled = false, 
  onClick,
  className = "" 
}) {
  return (
    <button
      type={type}
      className={`${styles.btn} ${styles[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? <span className={styles.spinner}></span> : children}
    </button>
  );
}
