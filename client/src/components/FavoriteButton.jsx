import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { addFavoriteApi, removeFavoriteApi } from "../api/favorites";

export default function FavoriteButton({ listingId, initial = false, onToggle, targetType = "accommodation" }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState(initial);
  const [busy, setBusy] = useState(false);

  const handleClick = async (e) => {
    // Nút nằm trong thẻ <Link>, không để click lan ra làm chuyển trang
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate("/login");
      return;
    }
    if (busy) return;

    const next = !active;
    setBusy(true);
    setActive(next); // cập nhật ngay cho mượt, lỗi thì hoàn lại
    try {
      await (next ? addFavoriteApi(targetType, listingId) : removeFavoriteApi(targetType, listingId));
      onToggle?.(listingId, next);
    } catch {
      setActive(!next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? "Bỏ yêu thích" : "Yêu thích"}
      className="rounded-full bg-white/90 px-2 py-1 text-lg shadow hover:scale-110 dark:bg-gray-900/90"
    >
      {active ? "❤️" : "🤍"}
    </button>
  );
}