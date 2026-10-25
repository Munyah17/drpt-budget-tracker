"use client";

import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import { downloadBlob } from "@/lib/download";

export default function AdminReportsPage() {
  const { toast } = useAppData();

  const handleGenerateReport = (reportName: string) => {
    downloadBlob(
      `${reportName.toLowerCase().replace(/\s+/g, "-")}.csv`,
      `"metric","value"\n"report","${reportName}"\n"generated","${new Date().toISOString()}"\n"total_users","1247"\n`,
      "text/csv"
    );
    toast(`${reportName} generated`, "file-down");
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Platform Reports</h2>
          <p className="section-sub">Generate and view platform-wide reports</p>
        </div>
      </div>

      <div className="grid grid-2">
        {[
          { name: "User Activity Report", desc: "Track user engagement and activity patterns", icon: "users" },
          { name: "Revenue Report", desc: "Platform revenue and subscription analytics", icon: "dollar-sign" },
          { name: "Transaction Report", desc: "All platform transactions summary", icon: "list" },
          { name: "Category Analysis", desc: "Spending categories across all users", icon: "pie-chart" },
          { name: "Growth Report", desc: "User acquisition and retention metrics", icon: "trending-up" },
          { name: "System Performance", desc: "Platform performance and uptime metrics", icon: "activity" },
        ].map((report, idx) => (
          <div key={idx} className="glass-card card-pad" style={{ cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: "var(--radius-sm)", background: "var(--pink-100)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={report.icon} size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{report.name}</div>
                <div style={{ fontSize: 13, color: "var(--ink-500)" }}>{report.desc}</div>
              </div>
            </div>
            <button className="btn btn-ghost" style={{ width: "100%" }} onClick={() => handleGenerateReport(report.name)}>
              Generate Report
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
