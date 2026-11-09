import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { addFavoriteApi, removeFavoriteApi } from "../api/favorites";
import Icon from "./Icon";
import { toast } from "./fx/Toaster";

export default function FavoriteButton({ listingId, initial = false, onToggle, targetType = "accommodation" }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [popKey, setPopKey] = useState(0); // đổi key để chạy lại hiệu ứng "bật"

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
    if (next) setPopKey((k) => k + 1);
    try {
      await (next ? addFavoriteApi(targetType, listingId) : removeFavoriteApi(targetType, listingId));
      onToggle?.(listingId, next);
      toast(next ? "Đã lưu vào Yêu thích" : "Đã bỏ khỏi Yêu thích");
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
      aria-pressed={active}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-[var(--shadow-soft)] backdrop-blur transition-transform hover:scale-110 active:scale-95 dark:bg-gray-900/80 dark:text-gray-200"
    >
      <span key={popKey} className={popKey ? "pop" : ""}>
        <Icon name="heart" size={19} className={active ? "fill-rose-500 text-rose-500" : ""} />
      </span>
    </button>
  );
}
