"use client";

import { useAppData } from "@/lib/AppDataContext";

export default function EmployeeSalaryPage() {
  const { user } = useAppData();

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Salary Management</h2>
          <p className="section-sub">Compensation and deduction breakdown — {user?.organisation ?? "your organisation"}</p>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">Annual Gross</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Monthly Gross</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Monthly Net</div>
          <div className="stat-value">—</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="glass-card card-pad">
          <h3 style={{ fontWeight: 600, marginBottom: 14, fontSize: 15 }}>Monthly Deductions</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td colSpan={2} style={{ padding: "24px 8px", fontSize: 13, color: "var(--ink-500)", textAlign: "center" }}>
                  No deduction data yet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="glass-card card-pad">
          <h3 style={{ fontWeight: 600, marginBottom: 14, fontSize: 15 }}>Salary History</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
                <th style={{ padding: "10px 6px", fontWeight: 600, fontSize: 12 }}>Effective</th>
                <th style={{ padding: "10px 6px", fontWeight: 600, fontSize: 12 }}>Annual</th>
                <th style={{ padding: "10px 6px", fontWeight: 600, fontSize: 12 }}>Change</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={3} style={{ padding: "24px 8px", fontSize: 13, color: "var(--ink-500)", textAlign: "center" }}>
                  No salary history recorded yet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
