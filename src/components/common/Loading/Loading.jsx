import styles from "./Loading.module.css";

export default function Loading({ fullScreen = false }) {
  return (
    <div className={`${styles.loadingContainer} ${fullScreen ? styles.fullScreen : ""}`}>
      <div className={styles.loader}></div>
      <p>LEANH STUDIO</p>
    </div>
  );
}
