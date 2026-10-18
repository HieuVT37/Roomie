import { useEffect } from "react";

export const SITE_NAME = "Roomie";
export const DEFAULT_TITLE = "Roomie - Tìm bạn cùng phòng";

// "Tìm phòng trọ" -> "Tìm phòng trọ | Roomie"; để trống thì dùng tiêu đề mặc định
export const formatTitle = (title) => (title ? `${SITE_NAME} - ${title}` : DEFAULT_TITLE);

// Dùng ở trang chi tiết khi tiêu đề phụ thuộc dữ liệu tải về (tên phòng, tên người dùng...)
export default function usePageTitle(title) {
  useEffect(() => {
    if (title) document.title = formatTitle(title);
  }, [title]);
}