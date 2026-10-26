"use client";

import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";

export default function EmployeeHomePage() {
  const { user } = useAppData();

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Employment</h2>
          <p className="section-sub">{user?.organisation ?? "Your organisation"} — employee account</p>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">Net Pay (May)</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Next Pay Date</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Leave Balance</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Benefits Enrolled</div>
          <div className="stat-value">—</div>
        </div>
      </div>

      <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <Icon name="briefcase" size={18} style={{ color: "var(--rose-600)" }} />
          <h3 style={{ fontWeight: 600, fontSize: 15 }}>Employment Details</h3>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td style={{ padding: "10px 6px", fontSize: 13, color: "var(--ink-500)", width: 180 }}>Organisation</td>
              <td style={{ padding: "10px 6px", fontWeight: 600 }}>{user?.organisation ?? "—"}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td style={{ padding: "10px 6px", fontSize: 13, color: "var(--ink-500)" }}>Department</td>
              <td style={{ padding: "10px 6px" }}>—</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td style={{ padding: "10px 6px", fontSize: 13, color: "var(--ink-500)" }}>Job Title</td>
              <td style={{ padding: "10px 6px" }}>—</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td style={{ padding: "10px 6px", fontSize: 13, color: "var(--ink-500)" }}>Contract Type</td>
              <td style={{ padding: "10px 6px" }}>—</td>
            </tr>
            <tr>
              <td style={{ padding: "10px 6px", fontSize: 13, color: "var(--ink-500)" }}>Start Date</td>
              <td style={{ padding: "10px 6px" }}>—</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="glass-card card-pad">
        <h3 style={{ fontWeight: 600, marginBottom: 14, fontSize: 15 }}>Recent Payslips</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "10px 6px", fontWeight: 600, fontSize: 12 }}>Period</th>
              <th style={{ padding: "10px 6px", fontWeight: 600, fontSize: 12 }}>Net Pay</th>
              <th style={{ padding: "10px 6px", fontWeight: 600, fontSize: 12 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={3} style={{ padding: "24px 8px", fontSize: 13, color: "var(--ink-500)", textAlign: "center" }}>
                No payslips yet — they'll appear here once payroll runs.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
