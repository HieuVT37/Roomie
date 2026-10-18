import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { notificationsApi } from "../api/notifications";

const NotificationContext = createContext({ messages: 0, connections: 0, refresh: () => {} });

const POLL_MS = 10000;

// Số tin nhắn chưa đọc và thông báo kết nối chưa xem, dùng cho chấm đỏ trên thanh menu
export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [counts, setCounts] = useState({ messages: 0, connections: 0 });
  const enabled = Boolean(user) && user.role !== "admin";

  const refresh = useCallback(() => {
    if (!enabled) return Promise.resolve();
    return notificationsApi()
      .then((res) => setCounts({ messages: res.messages || 0, connections: res.connections || 0 }))
      .catch(() => {});
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setCounts({ messages: 0, connections: 0 });
      return undefined;
    }
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, refresh]);

  return <NotificationContext.Provider value={{ ...counts, refresh }}>{children}</NotificationContext.Provider>;
}

export const useNotifications = () => useContext(NotificationContext);
