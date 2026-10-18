// Query string có thể là object (?a[$ne]=1) nên luôn ép về chuỗi/số trước khi đưa vào truy vấn Mongo
export const str = (v) => (typeof v === "string" ? v.trim() : "");

export const num = (v) => {
  if (typeof v !== "string" || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");