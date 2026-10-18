import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Trang chỉ dành cho người chưa đăng nhập (login, register)
export default function GuestRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p>Đang tải...</p>;
  if (user) return <Navigate to={location.state?.from?.pathname || "/matching"} replace />;

  return <Outlet />;
}