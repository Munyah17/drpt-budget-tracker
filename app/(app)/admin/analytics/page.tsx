"use client";


export default function AdminAnalyticsPage() {
  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Platform Analytics</h2>
          <p className="section-sub">Platform-wide performance metrics and insights</p>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">Total Users</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Active Users (30d)</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Monthly Revenue</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Avg Session Duration</div>
          <div className="stat-value">—</div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>User Growth</h3>
          </div>
          <p style={{ color: "var(--ink-500)", fontSize: 13, padding: "48px 0", textAlign: "center" }}>
            No user metrics yet — growth data will appear here once users sign up.
          </p>
        </div>

        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>Revenue Trend</h3>
          </div>
          <p style={{ color: "var(--ink-500)", fontSize: 13, padding: "48px 0", textAlign: "center" }}>
            No revenue data yet — connect billing to populate this chart.
          </p>
        </div>
      </div>

      <div className="glass-card card-pad">
        <div className="card-head">
          <h3>Top Categories by Volume</h3>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Category</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Transaction Count</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Total Volume</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Growth</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={4} style={{ padding: "24px 8px", fontSize: 13, color: "var(--ink-500)", textAlign: "center" }}>
                No transaction data yet — top categories will appear here.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
