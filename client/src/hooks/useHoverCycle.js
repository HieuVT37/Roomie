import { useEffect, useState } from "react";
import { reducedMotion } from "./useMotion";

// Rê chuột lên thẻ có nhiều ảnh: ảnh tự chuyển lần lượt; rời chuột thì về ảnh bìa.
export default function useHoverCycle(count, interval = 1100) {
  const [hovering, setHovering] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!hovering || count < 2 || reducedMotion()) return undefined;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), interval);
    return () => clearInterval(t);
  }, [hovering, count, interval]);

  const bind = {
    onMouseEnter: () => setHovering(true),
    onMouseLeave: () => {
      setHovering(false);
      setIndex(0);
    },
  };
  return { index: count ? index % count : 0, bind };
}
