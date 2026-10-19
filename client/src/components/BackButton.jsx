import { Link, useLocation, useNavigate } from "react-router-dom";
import { readLastViewed } from "../utils/lastViewed";

export default function BackButton({ to, children = "Quay lại danh sách" }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleClick = (e) => {
    const saved = readLastViewed();
    // Trang chi tiết này có phải trang vừa được mở từ một thẻ không (id nằm cuối đường dẫn)
    const openedFromCard = saved && pathname.endsWith("/" + saved.id);

    // Nếu đúng: quay lại đúng nơi đã bấm (Tìm phòng, Yêu thích, Trang chủ...), như nút Back
    if (openedFromCard && window.history.state?.idx > 0) {
      e.preventDefault();
      navigate(-1);
    }
    // Ngược lại (vào thẳng link chi tiết): chạy như Link bình thường, đưa về `to`
  };

  return (
    <Link
      to={to}
      onClick={handleClick}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
    >
      <span aria-hidden="true">←</span>
      {children}
    </Link>
  );
}