"use client";

import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";

export default function AdminIntegrationsPage() {
  const handleConfigure = (item: string) => {
    alert(`Configuring ${item}...`);
  };

  const handleMonitor = (item: string) => {
    alert(`Monitoring ${item}...`);
  };

  const handleConnect = (item: string) => {
    alert(`Connecting to ${item}...`);
  };
  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Integrations</h2>
          <p className="section-sub">API partners, connections and usage</p>
        </div>
        <button className="btn btn-primary">
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          Add Integration
        </button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">Active Integrations</div>
          <div className="stat-value">3</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">API Calls Today</div>
          <div className="stat-value">12,450</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Failed Requests</div>
          <div className="stat-value">23</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Avg Response Time</div>
          <div className="stat-value">145ms</div>
        </div>
      </div>

      <div className="glass-card card-pad">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Partner</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Type</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Last Sync</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>API Calls (24h)</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td style={{ padding: "12px 8px", fontWeight: 600 }}>Gusto Payroll</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>Payroll Provider</td>
              <td style={{ padding: "12px 8px" }}><span className="badge badge-green">Connected</span></td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>2025-05-26 15:30</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>5,230</td>
              <td style={{ padding: "12px 8px" }}>
                <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleConfigure("Gusto Payroll")}><Icon name="settings" size={14} style={{ marginRight: 4 }} />Configure</button>
                <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleMonitor("Gusto Payroll")}><Icon name="activity" size={14} style={{ marginRight: 4 }} />Monitor</button>
              </td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td style={{ padding: "12px 8px", fontWeight: 600 }}>QuickBooks</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>Accounting</td>
              <td style={{ padding: "12px 8px" }}><span className="badge badge-green">Connected</span></td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>2025-05-26 14:15</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>3,450</td>
              <td style={{ padding: "12px 8px" }}>
                <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleConfigure("QuickBooks")}><Icon name="settings" size={14} style={{ marginRight: 4 }} />Configure</button>
                <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleMonitor("QuickBooks")}><Icon name="activity" size={14} style={{ marginRight: 4 }} />Monitor</button>
              </td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td style={{ padding: "12px 8px", fontWeight: 600 }}>Stripe</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>Payments</td>
              <td style={{ padding: "12px 8px" }}><span className="badge badge-amber">Degraded</span></td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>2025-05-26 13:00</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>3,770</td>
              <td style={{ padding: "12px 8px" }}>
                <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleConfigure("Stripe")}><Icon name="settings" size={14} style={{ marginRight: 4 }} />Configure</button>
                <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleMonitor("Stripe")}><Icon name="activity" size={14} style={{ marginRight: 4 }} />Monitor</button>
              </td>
            </tr>
            <tr>
              <td style={{ padding: "12px 8px", fontWeight: 600 }}>SAP SuccessFactors</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>HR System</td>
              <td style={{ padding: "12px 8px" }}><span className="badge badge-blue">Pending</span></td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>-</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>0</td>
              <td style={{ padding: "12px 8px" }}>
                <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleConfigure("SAP SuccessFactors")}><Icon name="settings" size={14} style={{ marginRight: 4 }} />Configure</button>
                <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleConnect("SAP SuccessFactors")}><Icon name="link" size={14} style={{ marginRight: 4 }} />Connect</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
