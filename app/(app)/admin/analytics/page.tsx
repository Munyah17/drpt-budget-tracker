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
          <div className="stat-value">1,247</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Active Users (30d)</div>
          <div className="stat-value">892</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Monthly Revenue</div>
          <div className="stat-value">$456</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Avg Session Duration</div>
          <div className="stat-value">8.5m</div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>User Growth</h3>
          </div>
          <div style={{ height: 200, display: "flex", alignItems: "flex-end", gap: 8, padding: 20 }}>
            {[65, 78, 92, 85, 110, 125, 140, 155, 170, 185, 200, 220].map((val, idx) => (
              <div key={idx} style={{ flex: 1, height: `${val}%`, background: "var(--rose-500)", borderRadius: 4 }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-500)", marginTop: 8 }}>
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
          </div>
        </div>

        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>Revenue Trend</h3>
          </div>
          <div style={{ height: 200, display: "flex", alignItems: "flex-end", gap: 8, padding: 20 }}>
            {[40, 55, 45, 70, 65, 80, 75, 90, 85, 100, 95, 110].map((val, idx) => (
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
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>Housing</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>2,450</td>
              <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 600 }}>$1,245,000</td>
              <td style={{ padding: "12px 8px" }}><span className="badge badge-green">+12%</span></td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>Food</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>3,890</td>
              <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 600 }}>$456,000</td>
              <td style={{ padding: "12px 8px" }}><span className="badge badge-green">+8%</span></td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>Transport</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>1,820</td>
              <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 600 }}>$234,000</td>
              <td style={{ padding: "12px 8px" }}><span className="badge badge-red">-3%</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
