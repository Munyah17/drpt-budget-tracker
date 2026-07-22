"use client";

import { useEffect, useState } from "react";

export default function CircleProgress({ pct, color }: { pct: number; color: string }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const [offset, setOffset] = useState(c);
  useEffect(() => {
    const target = c - (Math.min(pct, 100) / 100) * c;
    const raf = requestAnimationFrame(() => setOffset(target));
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pct]);

  return (
    <div className="circle-progress">
      <svg viewBox="0 0 84 84">
        <circle cx="42" cy="42" r={r} fill="none" stroke="var(--pink-100)" strokeWidth="8" />
        <circle
          cx="42"
          cy="42"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      <div className="pct">{pct}%</div>
    </div>
  );
}
