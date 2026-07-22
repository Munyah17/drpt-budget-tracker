import { LegendSeries } from "./ChartLegend";

export interface LineSeries {
  name: string;
  color: string;
  data: number[];
}

export default function LineChart({
  labels,
  series,
  width = 560,
  height = 230,
}: {
  labels: string[];
  series: LineSeries[];
  width?: number;
  height?: number;
}) {
  const max = Math.max(...series.flatMap((s) => s.data)) * 1.12;
  const padL = 6, padR = 6, padT = 10, padB = 26;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const stepX = labels.length > 1 ? plotW / (labels.length - 1) : 0;

  function pts(data: number[]) {
    return data.map((v, i): [number, number] => [padL + i * stepX, padT + plotH - (v / max) * plotH]);
  }

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", display: "block" }}>
        {series.map((s) => {
          const p = pts(s.data);
          const d = p.map((pt, i) => (i === 0 ? "M" : "L") + pt[0].toFixed(1) + " " + pt[1].toFixed(1)).join(" ");
          const areaD = `${d} L ${p[p.length - 1][0].toFixed(1)} ${(height - padB).toFixed(1)} L ${p[0][0].toFixed(1)} ${(height - padB).toFixed(1)} Z`;
          return (
            <g key={s.name}>
              <path d={areaD} fill={s.color + "1f"} stroke="none" />
              <path d={d} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              {p.map((pt, i) => (
                <circle key={i} cx={pt[0].toFixed(1)} cy={pt[1].toFixed(1)} r={3.2} fill={s.color} stroke="#fff" strokeWidth={1.5} />
              ))}
            </g>
          );
        })}
        {labels.map((lab, i) => (
          <text
            key={lab}
            x={(padL + i * stepX).toFixed(1)}
            y={height - 8}
            fontSize={11}
            textAnchor="middle"
            style={{ fill: "var(--ink-500)" }}
          >
            {lab}
          </text>
        ))}
      </svg>
      <LegendSeries series={series} />
    </div>
  );
}
