"use client";

import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import { downloadBlob } from "@/lib/download";

const REPORTS = [
  { name: "Headcount Report", desc: "Employee count by department and location", icon: "users" },
  { name: "Payroll Summary", desc: "Monthly payroll cost breakdown", icon: "dollar-sign" },
  { name: "Turnover Report", desc: "Joiners, leavers and retention rates", icon: "repeat" },
  { name: "Benefits Utilisation", desc: "Enrolment and cost per benefit scheme", icon: "heart-pulse" },
  { name: "Compliance Report", desc: "Right-to-work, contracts and policy status", icon: "shield" },
];

export default function CorporateReportsPage() {
  const { toast } = useAppData();

  const handleDownload = (name: string) => {
    downloadBlob(
      `${name.toLowerCase().replace(/\s+/g, "-")}.csv`,
      `"metric","value"\n"report","${name}"\n"generated","${new Date().toISOString()}"\n"employees","450"\n` ,
      "text/csv"
    );
    toast(`${name} generated`, "file-down");
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Reports</h2>
          <p className="section-sub">Generate workforce and payroll reports</p>
        </div>
      </div>

      <div className="grid grid-2">
        {REPORTS.map((r) => (
          <div key={r.name} className="glass-card card-pad" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: "var(--pink-100)",
                color: "var(--rose-600)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <Icon name={r.icon} size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
                <div style={{ fontSize: 12, color: "var(--ink-500)" }}>{r.desc}</div>
              </div>
            </div>
            <button className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => handleDownload(r.name)}>
              <Icon name="download" size={14} style={{ marginRight: 4 }} />Generate
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
