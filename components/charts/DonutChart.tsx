import { useTranslations } from "next-intl";
import { fmt } from "@/lib/format";
import { LegendCategories } from "./ChartLegend";

export default function DonutChart({
  data,
  colors,
  size = 176,
  legend = true,
}: {
  data: Record<string, number>;
  colors: Record<string, string>;
  size?: number;
  legend?: boolean;
}) {
  const t = useTranslations("Pages.components");
  const strokeWidth = Math.round(size * 0.135);
  const entries = Object.entries(data);
  const total = entries.reduce((a, [, v]) => a + v, 0) || 1;
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  let cum = 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
          {entries.map(([label, val]) => {
            const frac = val / total;
            const segLen = Math.max(frac * c - 1.5, 0);
            const offset = -cum;
            cum += frac * c;
            const color = colors[label] || "#d9b8c6";
            return (
              <circle
                key={label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${segLen} ${c - segLen}`}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
        <div style={{ position: "absolute", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "var(--ink-500)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".03em" }}>
            {t("donut_total")}
          </div>
          <div style={{ fontSize: 17, fontWeight: 800 }}>{fmt(total)}</div>
        </div>
      </div>
      {legend && <LegendCategories data={data} colors={colors} />}
    </div>
  );
}
