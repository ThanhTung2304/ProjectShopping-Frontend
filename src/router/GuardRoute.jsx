import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/authContextValue";

export default function GuardRoute({ children }) {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    // Tùy chọn: Hiển thị spinner hoặc null trong khi đang kiểm tra trạng thái xác thực
    return null;
  }

  if (!isAuthenticated) {
    // Người dùng chưa đăng nhập, chuyển hướng về trang đăng nhập
    return <Navigate to="/auth" replace />;
  }
  return children;
}
