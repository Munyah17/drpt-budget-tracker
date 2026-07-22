"use client";

import { useEffect, useState } from "react";

export default function ProgressBar({ pct, color }: { pct: number; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setWidth(pct));
    return () => cancelAnimationFrame(raf);
  }, [pct]);
  return (
    <div className="progress-track" style={{ flex: 1 }}>
      <div className="progress-fill" style={{ width: width + "%", background: color }} />
    </div>
  );
}
