// Chỉ giữ chữ số: "2.000.000" -> "2000000"
export const digitsOnly = (v) => String(v ?? "").replace(/\D/g, "");

// Hiển thị kiểu VNĐ có dấu chấm ngăn cách hàng nghìn: 2000000 -> "2.000.000"
export const groupVND = (v) => {
  const d = digitsOnly(v).replace(/^0+(?=\d)/, "");
  return d.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};
