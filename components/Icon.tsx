"use client";

import { CSSProperties } from "react";
import { ICON_SVGS } from "@/lib/icons";

export default function Icon({
  name,
  size = 20,
  style,
  className,
}: {
  name: string;
  size?: number;
  style?: CSSProperties;
  className?: string;
}) {
  const inner = ICON_SVGS[name] || ICON_SVGS["circle"];
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        width: size,
        height: size,
        ...style,
      }}
      dangerouslySetInnerHTML={{
        __html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;display:block;">${inner}</svg>`,
      }}
    />
  );
}
