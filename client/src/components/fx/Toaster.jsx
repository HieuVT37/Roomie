import { useEffect, useState } from "react";

// Thông báo nổi ở góc màn hình, dấu ✓ tự vẽ. Gọi toast("...") từ bất kỳ đâu.
const EVENT = "roomie:toast";
let nextId = 1;

// eslint-disable-next-line react-refresh/only-export-components
export function toast(message) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { id: nextId++, message } }));
}

export default function Toaster() {
  const [items, setItems] = useState([]); // { id, message, leaving }

  useEffect(() => {
    const timers = [];
    const onToast = (e) => {
      const t = e.detail;
      setItems((list) => [...list.slice(-2), { ...t, leaving: false }]); // tối đa 3 cái
      timers.push(setTimeout(() => setItems((list) => list.map((x) => (x.id === t.id ? { ...x, leaving: true } : x))), 3200));
      timers.push(setTimeout(() => setItems((list) => list.filter((x) => x.id !== t.id)), 3500));
    };
    window.addEventListener(EVENT, onToast);
    return () => {
      window.removeEventListener(EVENT, onToast);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="toaster" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast ${t.leaving ? "is-leaving" : ""}`}>
          <svg className="check-draw shrink-0 text-emerald-500" width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="13" cy="13" r="10.5" />
            <path d="m8.5 13.5 3 3 6-7" />
          </svg>
          <p className="text-sm font-medium">{t.message}</p>
        </div>
      ))}
    </div>
  );
}
