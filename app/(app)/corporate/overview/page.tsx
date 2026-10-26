"use client";

import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";

export default function CorporateOverviewPage() {
  const router = useRouter();
  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Corporate Dashboard</h2>
          <p className="section-sub">Acme Corporation — workforce overview</p>
        </div>
        <button className="btn btn-primary" onClick={() => router.push("/corporate/employees/onboarding")}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          Add Employee
        </button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">Total Employees</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Active This Month</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Payroll This Month</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Pending Onboarding</div>
          <div className="stat-value">—</div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <h3 style={{ fontWeight: 600, marginBottom: 16, fontSize: 15 }}>Recent Payroll Runs</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
                <th style={{ padding: "10px 6px", fontWeight: 600, fontSize: 12 }}>Period</th>
                <th style={{ padding: "10px 6px", fontWeight: 600, fontSize: 12 }}>Amount</th>
                <th style={{ padding: "10px 6px", fontWeight: 600, fontSize: 12 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={3} style={{ padding: "24px 8px", fontSize: 13, color: "var(--ink-500)", textAlign: "center" }}>
                  No payroll runs recorded yet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="glass-card card-pad">
          <h3 style={{ fontWeight: 600, marginBottom: 16, fontSize: 15 }}>Pending Tasks</h3>
          <p style={{ color: "var(--ink-500)", fontSize: 13, padding: "16px 0" }}>
            No pending tasks — onboarding, payroll and compliance items will appear here.
          </p>
        </div>
      </div>

      <div className="glass-card card-pad">
        <h3 style={{ fontWeight: 600, marginBottom: 16, fontSize: 15 }}>Department Breakdown</h3>
        <div className="grid grid-4">
          <div>
            <div className="stat-label">Engineering</div>
            <div className="stat-value" style={{ fontSize: 22 }}>—</div>
          </div>
          <div>
            <div className="stat-label">Sales</div>
            <div className="stat-value" style={{ fontSize: 22 }}>—</div>
          </div>
          <div>
            <div className="stat-label">Operations</div>
            <div className="stat-value" style={{ fontSize: 22 }}>—</div>
          </div>
          <div>
            <div className="stat-label">Finance & Admin</div>
            <div className="stat-value" style={{ fontSize: 22 }}>—</div>
          </div>
        </div>
      </div>
    </>
  );
}
