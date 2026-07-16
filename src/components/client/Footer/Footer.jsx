import styles from "./Footer.module.css";
import { Link} from "react-router-dom";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.linksRow}>
          <div className={styles.col}>
            <h4>DỊCH VỤ LIÊN HỆ</h4>
            <Link to="https://www.facebook.com/share/1DhZu4WZAG/?mibextid=wwXIfr" 
                target="_blank" rel="noopener noreferrer">
                TRANG FACEBOOK CỦA CHÚNG TÔI
              </Link>
            <Link to="https://www.tiktok.com/@more.stuuu?_r=1&_d=secCgYIASAHKAESPgo8Dtp7zXk7Y2nmK8Gjp%2Bkpa3v2C43Tye6ymuEDgTkavq0tPOO8vwWpMRZXmf85WbA4sQVzGxJ4CxK8pXh9GgA%3D&_svg=1&checksum=afed447aab1c86b96f116d9925d663c5dd391a0b29820708be75f24629acec45&item_author_type=2&reflow_sign_scene=7&rgssign=8.1.JrPFTAe3geuAEj4K1Z0oeg&sec_uid=MS4wLjABAAAAH9712RjpQtAikH7FLAxf0vSy6mWjKl2U1yQdiqgejy3vWSrn4OvxLgq0vEuIhY-U&sec_user_id=MS4wLjABAAAAL5BUb7ajDz9sUfKASnyu43qjz-OFLI0yYlR6mhVns1W3expCz6mhiry9Qgvz5A8v&share_app_id=1180&share_author_id=6991673263336621083&share_link_id=8B099463-268A-4BDF-A1F4-61D9C4772096&share_region=VN&share_scene=1&sharer_language=vi&social_share_type=5&source=h5_t&timestamp=1784207195&tt_from=copy&u_code=db7093ik5l7482&ug_btm=b5836&user_id=6800219751824327682&utm_campaign=client_share&utm_medium=ios&utm_source=copy"
                target="_blank" rel="noopener noreferrer">
                TRANG TIKTOK CỦA CHÚNG TÔI
              </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
