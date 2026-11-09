// Query string có thể là object (?a[$ne]=1) nên luôn ép về chuỗi/số trước khi đưa vào truy vấn Mongo
export const str = (v) => (typeof v === "string" ? v.trim() : "");

export const num = (v) => {
  if (typeof v !== "string" || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Tìm tiếng Việt không cần gõ dấu: "cau giay" khớp "Cầu Giấy", "dong da" khớp "Đống Đa".
// Bỏ dấu chuỗi người dùng gõ, rồi mỗi nguyên âm / chữ d được thay bằng nhóm mọi biến thể có dấu.
const VI_GROUPS = {
  a: "aàáạảãâầấậẩẫăằắặẳẵ",
  e: "eèéẹẻẽêềếệểễ",
  i: "iìíịỉĩ",
  o: "oòóọỏõôồốộổỗơờớợởỡ",
  u: "uùúụủũưừứựửữ",
  y: "yỳýỵỷỹ",
  d: "dđ",
};
export const viRegex = (text) => {
  const plain = text
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // bỏ dấu thanh, dấu mũ
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .slice(0, 50);
  const pattern = [...plain]
    .map((ch) => (VI_GROUPS[ch] ? `[${VI_GROUPS[ch]}]` : escapeRegex(ch)))
    .join("");
  return new RegExp(pattern, "i");
};