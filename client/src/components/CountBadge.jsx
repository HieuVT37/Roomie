export default function CountBadge({ count, inline = false }) {
  if (!count) return null;
  const position = inline ? "shrink-0" : "absolute -right-4 -top-2.5";
  return (
    <span
      className={`${position} flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}