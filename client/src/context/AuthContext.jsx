import { createContext, useContext, useEffect, useState } from "react";
import { registerApi, loginApi, logoutApi, meApi, verifyEmailApi } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Khi mở web: hỏi backend xem cookie đăng nhập còn hiệu lực không
  useEffect(() => {
    let active = true;
    meApi()
      .then((data) => {
        if (!active) return;
        setUser(data.user);
        setProfile(data.profile);
      })
      .catch(() => {}) // 401 = chưa đăng nhập, bình thường
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const login = async (email, password) => {
    const data = await loginApi({ email, password });
    setUser(data.user);
    setProfile(data.profile);
  };

  // Đăng ký chỉ tạo tài khoản chờ xác thực và gửi mã về email; chưa đăng nhập
  const register = (payload) => registerApi(payload);

  // Nhập đúng mã xác thực email: tài khoản được kích hoạt và đăng nhập luôn
  const verifyEmail = async (email, code) => {
    const data = await verifyEmailApi({ email, code });
    setUser(data.user);
    setProfile(data.profile);
  };

  const logout = async () => {
    await logoutApi();
    setUser(null);
    setProfile(null);
  };

  // Tải lại thông tin tài khoản (ví dụ sau khi đổi gói)
  const refreshUser = async () => {
    const data = await meApi();
    setUser(data.user);
    setProfile(data.profile);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, verifyEmail, logout, setProfile, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);