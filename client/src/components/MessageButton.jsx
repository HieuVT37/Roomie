import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { startConversationApi } from "../api/conversations";

// Nút "Nhắn tin" ở tin đăng: mở cuộc trò chuyện với người đăng
export default function MessageButton({ userId }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const open = async () => {
    setLoading(true);
    setError("");
    try {
      const { conversationId } = await startConversationApi(userId);
      navigate(`/messages/${conversationId}`);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể mở cuộc trò chuyện");
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={open}
        disabled={loading}
        className="w-full rounded-lg border border-indigo-500 px-3 py-2 font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-60 dark:text-indigo-300 dark:hover:bg-indigo-950"
      >
        {loading ? "Đang mở..." : "💬 Nhắn tin"}
      </button>
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-300">{error}</p>}
    </div>
  );
}