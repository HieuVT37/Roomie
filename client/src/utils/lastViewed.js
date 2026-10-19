import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const KEY = "lastViewed";

// Gọi khi người dùng bấm vào một thẻ (trước khi chuyển sang trang chi tiết)
export function saveLastViewed(id) {
  try {
    sessionStorage.setItem(
      KEY,
      JSON.stringify({ id: String(id), path: window.location.pathname + window.location.search })
    );
  } catch {}
}

export function readLastViewed() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY));
  } catch {
    return null;
  }
}

// Có phải đang quay lại (Back) đúng trang danh sách đã lưu không
export function isReturningTo(path, navType) {
  const saved = readLastViewed();
  return navType === "POP" && !!saved && saved.path === path;
}

// Dùng trong các trang danh sách: cuộn đến thẻ vừa xem sau khi dữ liệu tải xong
export function useRestoreLastViewed(ready) {
  const navType = useNavigationType();
  const { pathname, search } = useLocation();
  const done = useRef(false);
  const [id] = useState(() =>
    isReturningTo(pathname + search, navType) ? readLastViewed().id : null
  );

  useLayoutEffect(() => {
    if (!ready || !id || done.current) return;
    const el = document.querySelector(`[data-card-id="${CSS.escape(id)}"]`);
    if (el) {
      el.scrollIntoView({ block: "center" });
      done.current = true;
    }
  }, [ready, id]);
}

// Giống useState, nhưng khi người dùng QUAY LẠI từ trang chi tiết thì khôi phục
// giá trị cũ (trang, bộ lọc, tab). Vào bằng menu thì dùng giá trị ban đầu.
export function useReturnState(key, initial) {
  const navType = useNavigationType();
  const { pathname, search } = useLocation();

  const [value, setValue] = useState(() => {
    if (isReturningTo(pathname + search, navType)) {
      try {
        const raw = sessionStorage.getItem("listState:" + key);
        if (raw !== null) return JSON.parse(raw);
      } catch {}
    }
    return initial;
  });

  useEffect(() => {
    try {
      sessionStorage.setItem("listState:" + key, JSON.stringify(value));
    } catch {}
  }, [key, value]);

  return [value, setValue];
}