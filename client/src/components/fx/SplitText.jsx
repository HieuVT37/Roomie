// Tiêu đề hiện từng chữ: mỗi chữ mờ → rõ, lật nhẹ lên theo thứ tự.
// `lines`: mảng các dòng; trình đọc màn hình đọc nguyên câu qua aria-label.
export default function SplitText({ lines, as: Tag = "h1", className = "" }) {
  let i = 0;
  return (
    <Tag className={className} aria-label={lines.join(" ")} style={{ perspective: "600px" }}>
      {lines.map((line, li) => (
        <span key={li} aria-hidden="true" className="block">
          {line.split(" ").map((word, wi) => (
            <span key={wi}>
              <span className="split-word" style={{ "--i": i++ }}>{word}</span>
              {wi < line.split(" ").length - 1 ? " " : ""}
            </span>
          ))}
        </span>
      ))}
    </Tag>
  );
}
