import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CustomerLayout from "../layouts/CustomerLayout/CustomerLayout";
import AdminLayout from "../layouts/AdminLayout/AdminLayout";
import GuardRoute from "./GuardRoute";
import AdminRoute from "./AdminRoute";

// Pages
import AuthPage from "../pages/Auth/AuthPage";
import HomePage from "../pages/client/HomePage/HomePage";
import ProductListPage from "../pages/client/ProductListPage/ProductListPage";
import ProductDetailPage from "../pages/client/ProductDetailPage/ProductDetailPage";
import CheckoutPage from "../pages/client/CheckoutPage/CheckoutPage";
import CartPage from "../pages/client/CartPage/CartPage";
const AdminDashboard = () => <div style={{ padding: "100px" }}>Bảng điều khiển Admin</div>;
const ProfilePage = () => <div style={{ padding: "100px" }}>Trang cá nhân</div>;

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route xác thực (Công khai) */}
        <Route path="/auth" element={<AuthPage />} />
        
        {/* Phân hệ Khách hàng (Sử dụng Layout chung) */}
        <Route element={<CustomerLayout />}>
          <Route index element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/products" element={<ProductListPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />

          {/* Các Route cần ĐĂNG NHẬP (Sử dụng GuardRoute) */}
          <Route 
            path="/cart" 
            element={<GuardRoute><CartPage /></GuardRoute>} 
          />
          <Route 
            path="/profile" 
            element={<GuardRoute><ProfilePage /></GuardRoute>} 
          />
          <Route 
            path="/checkout" 
            element={<GuardRoute><CheckoutPage /></GuardRoute>} 
          />
        </Route>

        {/* Phân hệ Quản trị (Chỉ dành cho Admin) */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          {/* Thêm các route admin khác ở đây */}
        </Route>

        {/* Trang 404 */}
        <Route path="*" element={<div style={{ padding: "100px" }}>404 - Không tìm thấy trang</div>} />
      </Routes>
    </BrowserRouter>
  );
}
