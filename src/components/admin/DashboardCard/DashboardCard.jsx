import styles from "./DashboardCard.module.css";

export default function DashboardCard({ title, value, icon, trend, isIncrease }) {
  return (
    <div className={styles.card}>
      <div className={styles.iconBox}>
        <i className={icon}></i>
      </div>
      <div className={styles.content}>
        <p className={styles.title}>{title}</p>
        <h2 className={styles.value}>{value}</h2>
        {trend && (
          <span className={`${styles.trend} ${isIncrease ? styles.up : styles.down}`}>
            {isIncrease ? "↑" : "↓"} {trend} <small>so với tháng trước</small>
          </span>
        )}
      </div>
    </div>
  );
}
