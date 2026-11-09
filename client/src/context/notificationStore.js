import { createContext, useContext } from "react";

// Context và hook đọc số thông báo (tách khỏi file Provider để Fast Refresh hoạt động)
export const NotificationContext = createContext({ messages: 0, connections: 0, refresh: () => {} });

export const useNotifications = () => useContext(NotificationContext);
