import { useState } from "react";

// Nút con mắt hiện/ẩn mật khẩu — luôn hiển thị, không phụ thuộc nút "reveal" của trình duyệt
// (Edge chỉ hiện nút đó khi đang gõ và mất đi khi chuyển sang ô khác).
function PasswordToggle({ shown, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      onMouseDown={(e) => e.preventDefault()} // giữ con trỏ trong ô khi bấm
      className="password-toggle"
      aria-label={shown ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
      title={shown ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
    >
      {shown ? (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );
}

// Ô nhập có nhãn. `floating`: nhãn nằm trong ô và thu nhỏ bay lên khi gõ (dùng ở đăng nhập / đăng ký).
// Ô type="password" tự có nút con mắt để xem mật khẩu.
export default function FormField({ label, id, floating = false, type, ...props }) {
  const [shown, setShown] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && shown ? "text" : type;
  const inputClass = isPassword ? "input has-toggle" : "input";
  const toggle = isPassword && <PasswordToggle shown={shown} onToggle={() => setShown((s) => !s)} />;

  if (floating) {
    return (
      <div className="float-field">
        {/* placeholder=" " để CSS biết ô đang trống (:placeholder-shown) */}
        <input id={id} name={id} type={inputType} {...props} placeholder=" " className={inputClass} />
        <label htmlFor={id}>{label}</label>
        {toggle}
      </div>
    );
  }
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="relative">
        <input id={id} name={id} type={inputType} {...props} className={inputClass} />
        {toggle}
      </div>
    </div>
  );
}
