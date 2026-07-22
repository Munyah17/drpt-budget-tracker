export function LegendSeries({ series }: { series: { name: string; color: string }[] }) {
  return (
    <div className="chart-legend">
      {series.map((s) => (
        <span className="legend-item" key={s.name}>
          <i style={{ background: s.color }} />
          {s.name}
        </span>
      ))}
    </div>
  );
}

export function LegendCategories({
  data,
  colors,
  maxWidth = 260,
}: {
  data: Record<string, number>;
  colors: Record<string, string>;
  maxWidth?: number;
}) {
  const total = Object.values(data).reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="chart-legend" style={{ maxWidth }}>
      {Object.entries(data).map(([label, val]) => {
        const pct = Math.round((val / total) * 100);
        const color = colors[label] || "#d9b8c6";
        return (
          <span className="legend-item" key={label}>
            <i style={{ background: color }} />
            {label} <b style={{ color: "var(--ink-500)", fontWeight: 600, marginLeft: 2 }}>{pct}%</b>
          </span>
        );
      })}
    </div>
  );
}
