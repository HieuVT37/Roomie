import FormField from "./FormField";
import { digitsOnly, groupVND } from "../utils/money";

// Ô nhập số tiền: người dùng thấy "2.000.000", form nhận về chuỗi chữ số "2000000"
// (onChange vẫn trả về dạng { target: { name, value } } như ô nhập thường).
export default function MoneyField({ id, value, onChange, ...props }) {
  const handleChange = (e) => {
    onChange?.({ target: { name: id, value: digitsOnly(e.target.value) } });
  };
  return (
    <FormField
      id={id}
      {...props}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={groupVND(value)}
      onChange={handleChange}
    />
  );
}
