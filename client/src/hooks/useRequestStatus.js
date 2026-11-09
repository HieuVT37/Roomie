import { useCallback, useState } from "react";

// Trạng thái tải/lỗi cho một yêu cầu phụ thuộc vào `key` (ví dụ: trang, bộ lọc, tab).
// "Đang tải" được suy ra: khi key đổi mà chưa có kết quả cho key đó thì loading = true.
// Nhờ vậy effect không phải gọi setLoading(true)/setError("") đồng bộ (tránh render dây chuyền).
//
// Cách dùng trong effect:
//   api().then((res) => { if (!active) return; setData(res); finish(); })
//        .catch((err) => active && finish(message));
export default function useRequestStatus(key, emptyError = "") {
  const [status, setStatus] = useState({ key: null, error: emptyError });

  const loading = status.key !== key;
  // Lỗi của yêu cầu cũ không hiển thị khi đang tải yêu cầu mới (giống reset lỗi khi tải lại)
  const error = status.key === key ? status.error : emptyError;

  // Kết thúc yêu cầu của key hiện tại, kèm lỗi (nếu có)
  const finish = useCallback((err = emptyError) => setStatus({ key, error: err }), [key, emptyError]);

  // Đặt lỗi từ thao tác khác (nút bấm...), giữ nguyên trạng thái tải
  const setError = useCallback((err) => setStatus((s) => ({ ...s, error: err })), []);

  return { loading, error, finish, setError };
}
