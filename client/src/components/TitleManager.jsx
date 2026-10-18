import { useEffect } from "react";
import { matchPath, useLocation } from "react-router-dom";
import { formatTitle } from "../hooks/usePageTitle";

// Đường dẫn cụ thể phải đứng trước đường dẫn chung (ví dụ /pass/new trước /pass/:id)
const TITLES = [
  ["/", ""],
  ["/login", "Đăng nhập"],
  ["/register", "Đăng ký"],
  ["/matching", "Gợi ý bạn cùng phòng"],
  ["/matching/:userId", "Hồ sơ bạn cùng phòng"],
  ["/connections", "Kết nối"],
  ["/messages", "Tin nhắn"],
  ["/messages/:conversationId", "Tin nhắn"],
  ["/accommodation", "Tìm phòng trọ"],
  ["/accommodation/new", "Đăng tin cho thuê"],
  ["/accommodation/:id/edit", "Chỉnh sửa tin cho thuê"],
  ["/accommodation/:id", "Chi tiết phòng trọ"],
  ["/my-listings", "Tin cho thuê của tôi"],
  ["/pass", "Pass phòng & đồ dùng"],
  ["/pass/new", "Đăng bài Pass"],
  ["/pass/:id/edit", "Chỉnh sửa bài Pass"],
  ["/pass/:id", "Chi tiết bài Pass"],
  ["/my-pass", "Bài Pass của tôi"],
  ["/favorites", "Yêu thích"],
  ["/pricing", "Gói dịch vụ"],
  ["/checkout/:planCode", "Thanh toán"],
  ["/billing", "Gói của tôi"],
  ["/help", "Hỗ trợ"],
  ["/profile", "Hồ sơ của tôi"],
  ["/admin", "Quản trị - Tổng quan"],
  ["/admin/users", "Quản trị - Người dùng"],
  ["/admin/moderation", "Quản trị - Duyệt tin"],
  ["/admin/reports", "Quản trị - Báo cáo"],
  ["/admin/plans", "Quản trị - Gói dịch vụ"],
  ["/admin/faqs", "Quản trị - Hỗ trợ"],
];

export default function TitleManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    const found = TITLES.find(([pattern]) => matchPath(pattern, pathname));
    document.title = formatTitle(found ? found[1] : "");
  }, [pathname]);

  return null;
}