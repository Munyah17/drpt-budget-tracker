"use client";

import { useEffect, useState } from "react";
import { gbp } from "@/lib/format";
import { LegendSeries } from "./ChartLegend";

export interface BarSeries {
  name: string;
  color: string;
  data: number[];
}

export default function BarChart({ labels, series, maxVal }: { labels: string[]; series: BarSeries[]; maxVal?: number }) {
  const max = maxVal || Math.max(...series.flatMap((s) => s.data)) * 1.15;
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="barchart">
      <div className="barchart-plot">
        {labels.map((lab, i) => (
          <div className="barchart-group" key={lab}>
            <div className="barchart-bars">
              {series.map((s) => (
                <div
                  key={s.name}
                  className="barchart-bar"
                  style={{
                    background: s.color,
                    height: animated ? ((s.data[i] / max) * 100).toFixed(1) + "%" : "0%",
                  }}
                  data-tip={`${s.name}: ${gbp(s.data[i])}`}
                />
              ))}
            </div>
            <div className="barchart-label">{lab}</div>
          </div>
        ))}
      </div>
      <LegendSeries series={series} />
    </div>
  );
}
