import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { notificationsApi } from "../api/notifications";
import { NotificationContext } from "./notificationStore";

const ZERO = { messages: 0, connections: 0 };

const POLL_MS = 10000;

// Số tin nhắn chưa đọc và thông báo kết nối chưa xem, dùng cho chấm đỏ trên thanh menu
export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [counts, setCounts] = useState(ZERO);
  const enabled = Boolean(user) && user.role !== "admin";

  const refresh = useCallback(() => {
    if (!enabled) return Promise.resolve();
    return notificationsApi()
      .then((res) => setCounts({ messages: res.messages || 0, connections: res.connections || 0 }))
      .catch(() => {});
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return undefined;
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      setCounts(ZERO); // đăng xuất / đổi tài khoản: không giữ số cũ
    };
  }, [enabled, refresh]);

  // Khi chưa đăng nhập hoặc là admin: luôn 0
  const shown = enabled ? counts : ZERO;
  return <NotificationContext.Provider value={{ ...shown, refresh }}>{children}</NotificationContext.Provider>;
}
