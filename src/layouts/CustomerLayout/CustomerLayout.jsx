import { Outlet } from "react-router-dom";
import Header from "../../components/client/Header/Header";
import Footer from "../../components/client/Footer/Footer";
import styles from "./CustomerLayout.module.css";

/**
 * Layout dành cho phía Khách hàng
 * Bao gồm: Header cố định, phần nội dung thay đổi (Outlet) và Footer
 */
export default function CustomerLayout() {
  return (
    <div className={styles.layoutWrapper}>
      <Header />
      
      <main className={styles.mainContent}>
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}