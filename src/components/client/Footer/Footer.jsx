import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.newsletter}>
          <h3>ĐĂNG KÝ NHẬN TIN</h3>
          <p>Nhận thông báo về bộ sưu tập mới nhất và ưu đãi đặc quyền.</p>
          <div className={styles.inputBox}>
            <input type="email" placeholder="Email của bạn..." />
            <button>GỬI</button>
          </div>
        </div>

        <div className={styles.linksRow}>
          <div className={styles.col}>
            <h4>DỊCH VỤ KHÁCH HÀNG</h4>
            <a href="#">Liên hệ</a>
            <a href="#">Giao hàng & Trả hàng</a>
            <a href="#">Câu hỏi thường gặp</a>
          </div>
          <div className={styles.col}>
            <h4>VỀ LEANH STUDIO</h4>
            <a href="#">Câu chuyện thương hiệu</a>
            <a href="#">Tuyển dụng</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
