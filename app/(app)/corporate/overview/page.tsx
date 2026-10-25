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
          <div className="stat-value">450</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Active This Month</div>
          <div className="stat-value">438</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Payroll This Month</div>
          <div className="stat-value">$1.24M</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Pending Onboarding</div>
          <div className="stat-value">6</div>
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
              <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "10px 6px", fontSize: 13 }}>May 2025</td>
                <td style={{ padding: "10px 6px", fontSize: 13 }}>$412,300</td>
                <td style={{ padding: "10px 6px" }}><span className="badge badge-green">Paid</span></td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "10px 6px", fontSize: 13 }}>April 2025</td>
                <td style={{ padding: "10px 6px", fontSize: 13 }}>$408,950</td>
                <td style={{ padding: "10px 6px" }}><span className="badge badge-green">Paid</span></td>
              </tr>
              <tr>
                <td style={{ padding: "10px 6px", fontSize: 13 }}>June 2025</td>
                <td style={{ padding: "10px 6px", fontSize: 13 }}>$415,700</td>
                <td style={{ padding: "10px 6px" }}><span className="badge badge-blue">Scheduled</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="glass-card card-pad">
          <h3 style={{ fontWeight: 600, marginBottom: 16, fontSize: 15 }}>Pending Tasks</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
              <span className="badge badge-amber">Onboarding</span>
              <span>6 new hires awaiting document verification</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
              <span className="badge badge-blue">Payroll</span>
              <span>June payroll run scheduled for 28 June</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
              <span className="badge badge-red">Compliance</span>
              <span>2 right-to-work documents expire this month</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
              <span className="badge badge-green">Benefits</span>
              <span>Pension contribution review due 15 June</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card card-pad">
        <h3 style={{ fontWeight: 600, marginBottom: 16, fontSize: 15 }}>Department Breakdown</h3>
        <div className="grid grid-4">
          <div>
            <div className="stat-label">Engineering</div>
            <div className="stat-value" style={{ fontSize: 22 }}>142</div>
          </div>
          <div>
            <div className="stat-label">Sales</div>
            <div className="stat-value" style={{ fontSize: 22 }}>98</div>
          </div>
          <div>
            <div className="stat-label">Operations</div>
            <div className="stat-value" style={{ fontSize: 22 }}>76</div>
          </div>
          <div>
            <div className="stat-label">Finance & Admin</div>
            <div className="stat-value" style={{ fontSize: 22 }}>134</div>
          </div>
        </div>
      </div>
    </>
  );
}
