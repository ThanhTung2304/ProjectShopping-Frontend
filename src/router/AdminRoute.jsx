import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/authContextValue";
import { isAdminUser } from "../utils/authUtils";

export default function AdminRoute({ children }) {
  const { user, isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    // Tùy chọn: Hiển thị spinner hoặc null trong khi đang kiểm tra trạng thái xác thực
    return null;
  }

  if (!isAuthenticated) {
    // Người dùng chưa đăng nhập, chuyển hướng về trang đăng nhập
    return <Navigate to="/auth" replace />;
  }

  if (!isAdminUser(user)) {
    // Người dùng đã đăng nhập nhưng không phải admin, chuyển hướng về trang chủ
    return <Navigate to="/home" replace />;
  }
  return children;
}
