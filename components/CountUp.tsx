"use client";

import { useEffect, useRef, useState } from "react";

export default function CountUp({
  end,
  prefix = "",
  decimals = 2,
  duration = 1100,
  className,
}: {
  end: number;
  prefix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(() => prefix + (0).toLocaleString("en-GB", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }));
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    const startTime = performance.now();
    function step(now: number) {
      const p = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = end * eased;
      setDisplay(prefix + val.toLocaleString("en-GB", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }));
      if (p < 1) raf.current = requestAnimationFrame(step);
    }
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [end, prefix, decimals, duration]);

  return <span className={"count-up " + (className || "")}>{display}</span>;
}
