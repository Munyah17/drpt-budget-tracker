"use client";

import { useAppData } from "@/lib/AppDataContext";
import { REPORTS } from "@/lib/data";
import Icon from "@/components/Icon";

export default function ReportsPage() {
  const { toast } = useAppData();
  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Reports</h2>
          <p className="section-sub">Professional summaries, ready to export</p>
        </div>
        <button className="btn btn-primary" onClick={() => toast("Custom report builder would open here", "sliders-horizontal")}>
          <Icon name="sliders-horizontal" size={16} /> Custom Report
        </button>
      </div>
      <div className="glass-card card-pad">
        {REPORTS.map((r) => (
          <div
            key={r.name}
            style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 4px", borderBottom: "1px solid var(--card-border)", flexWrap: "wrap", rowGap: 10 }}
          >
            <div className="merchant-ic" style={{ width: 44, height: 44, borderRadius: 13 }}>
              <Icon name={r.icon} size={19} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>{r.name}</div>
              <div style={{ fontSize: 12.5, color: "var(--ink-500)" }}>{r.desc}</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => toast(r.name + " generated", "file-text")}>
              View
            </button>
            <button className="btn btn-ghost btn-sm" data-tip="Export PDF" onClick={() => toast("Exporting " + r.name + " as PDF…", "file-down")}>
              <Icon name="file-down" size={14} />
            </button>
            <button className="btn btn-ghost btn-sm" data-tip="Export CSV" onClick={() => toast("Exporting " + r.name + " as CSV…", "download")}>
              <Icon name="download" size={14} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
