"use client";


export default function AdminOverviewPage() {
  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Platform Overview</h2>
          <p className="section-sub">Super Admin command centre</p>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">Monthly Revenue</div>
          <div className="stat-value">$456</div>
          <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 4 }}>Collected vs target</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Active Corporates</div>
          <div className="stat-value">3</div>
          <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 4 }}>Contracted organisations</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Covered Employees</div>
          <div className="stat-value">1,247</div>
          <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 4 }}>Across active partners</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Outstanding Invoices</div>
          <div className="stat-value">$12,450</div>
          <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 4 }}>Due and overdue</div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>Revenue Trend</h3>
          </div>
          <div style={{ height: 200, display: "flex", alignItems: "flex-end", gap: 8, padding: 20 }}>
            {[40, 55, 45, 70, 65, 80, 75, 90, 85, 100, 95, 110].map((val, idx) => (
              <div key={idx} style={{ flex: 1, height: `${val}%`, background: "var(--rose-500)", borderRadius: 4 }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-500)", marginTop: 8 }}>
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
          </div>
        </div>

        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>Corporate Portfolio</h3>
          </div>
          <div style={{ height: 200, display: "flex", alignItems: "flex-end", gap: 8, padding: 20 }}>
            {[30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195].map((val, idx) => (
              <div key={idx} style={{ flex: 1, height: `${val}%`, background: "var(--green)", borderRadius: 4 }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-500)", marginTop: 8 }}>
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
          </div>
        </div>
      </div>

      <div className="glass-card card-pad">
        <div className="card-head">
          <h3>Action Queue</h3>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Type</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Description</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Assigned</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Priority</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>Integration Failure</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>Acme Corp payroll sync failed</td>
              <td style={{ padding: "12px 8px" }}><span className="badge badge-red">Critical</span></td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>John Smith</td>
              <td style={{ padding: "12px 8px" }}><span className="badge badge-red">High</span></td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>Overdue Invoice</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>TechCorp Ltd - $4,500 (15 days)</td>
              <td style={{ padding: "12px 8px" }}><span className="badge badge-amber">Pending</span></td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>Sarah Jones</td>
              <td style={{ padding: "12px 8px" }}><span className="badge badge-amber">Medium</span></td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>Contract Approval</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>New corporate partner - GlobalHealth</td>
              <td style={{ padding: "12px 8px" }}><span className="badge badge-blue">Review</span></td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>Director</td>
              <td style={{ padding: "12px 8px" }}><span className="badge badge-blue">Normal</span></td>
            </tr>
            <tr>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>Security Alert</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>Unusual login activity detected</td>
              <td style={{ padding: "12px 8px" }}><span className="badge badge-red">Critical</span></td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>Security Team</td>
              <td style={{ padding: "12px 8px" }}><span className="badge badge-red">High</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
