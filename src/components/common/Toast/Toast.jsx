import styles from "./Toast.module.css";

export default function Toast({ message, type = "success", show }) {
  if (!show) return null;
  
  return (
    <div className={`${styles.toast} ${styles[type]} ${show ? styles.show : ""}`}>
      <span className={styles.icon}>
        {type === "success" ? "✓" : "✕"}
      </span>
      {message}
    </div>
  );
}
