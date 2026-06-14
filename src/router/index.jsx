import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout/AdminLayout";
import CustomerLayout from "../layouts/CustomerLayout/CustomerLayout";
import AuthPage from "../pages/Auth/AuthPage";
import CouponMgmtPage from "../pages/admin/CouponMgmtPage/CouponMgmtPage";
import DashboardPage from "../pages/admin/DashboardPage/DashboardPage";
import InventoryPage from "../pages/admin/InventoryPage/InventoryPage";
import OrderMgmtPage from "../pages/admin/OrderMgmtPage/OrderMgmtPage";
import ProductMgmtPage from "../pages/admin/ProductMgmtPage/ProductMgmtPage";
import UserMgmtPage from "../pages/admin/UserMgmtPage/UserMgmtPage";
import CartPage from "../pages/client/CartPage/CartPage";
import CollectionDetailPage from "../pages/client/CollectionDetailPage/CollectionDetailPage";
import CollectionPage from "../pages/client/CollectionPage/CollectionPage";
import CheckoutPage from "../pages/client/CheckoutPage/CheckoutPage";
import HomePage from "../pages/client/HomePage/HomePage";
import ProductDetailPage from "../pages/client/ProductDetailPage/ProductDetailPage";
import ProductListPage from "../pages/client/ProductListPage/ProductListPage";
import ProfilePage from "../pages/client/ProfilePage/ProfilePage";
import VoucherPage from "../pages/client/VoucherPage/VoucherPage";
import AdminRoute from "./AdminRoute";
import GuardRoute from "./GuardRoute";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<AuthPage />} />
        <Route path="/auth" element={<AuthPage />} />

        <Route element={<CustomerLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/products" element={<ProductListPage />} />
          <Route path="/collections" element={<CollectionPage />} />
          <Route path="/collections/:categoryId" element={<CollectionDetailPage />} />
          <Route path="/vouchers" element={<VoucherPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route
            path="/cart"
            element={
              <GuardRoute>
                <CartPage />
              </GuardRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <GuardRoute>
                <ProfilePage />
              </GuardRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <GuardRoute>
                <CheckoutPage />
              </GuardRoute>
            }
          />
        </Route>

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="products" element={<ProductMgmtPage />} />
          <Route path="orders" element={<OrderMgmtPage />} />
          <Route path="users" element={<UserMgmtPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="coupons" element={<CouponMgmtPage />} />
        </Route>

        <Route path="*" element={<div style={{ padding: "100px" }}>404 - Không tìm thấy trang</div>} />
      </Routes>
    </BrowserRouter>
  );
}
