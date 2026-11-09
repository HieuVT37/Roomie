// Ô nhập có nhãn. `floating`: nhãn nằm trong ô và thu nhỏ bay lên khi gõ (dùng ở đăng nhập / đăng ký).
export default function FormField({ label, id, floating = false, ...props }) {
  if (floating) {
    return (
      <div className="float-field">
        {/* placeholder=" " để CSS biết ô đang trống (:placeholder-shown) */}
        <input id={id} name={id} {...props} placeholder=" " className="input" />
        <label htmlFor={id}>{label}</label>
      </div>
    );
  }
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input id={id} name={id} {...props} className="input" />
    </div>
  );
}
