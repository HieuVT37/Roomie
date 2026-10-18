export default function Avatar({ src, name, size = 56 }) {
  const style = { width: size, height: size };
  if (src) {
    return <img src={src} alt={name} style={style} className="rounded-full object-cover" />;
  }
  return (
    <div
      style={style}
      className="flex items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-600 dark:bg-indigo-900 dark:text-indigo-200"
    >
      {(name || "?").charAt(0).toUpperCase()}
    </div>
  );
}