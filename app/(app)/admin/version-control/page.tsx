"use client";

import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";

export default function VersionControlPage() {
  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Version Control</h2>
          <p className="section-sub">Manage application versions and deployments</p>
        </div>
        <button className="btn btn-primary">
          <Icon name="upload" size={16} style={{ marginRight: 8 }} />
          Deploy New Version
        </button>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">Current Version</div>
          <div className="stat-value">v2.1.0</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Total Deployments</div>
          <div className="stat-value">47</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Last Deployed</div>
          <div className="stat-value">2h ago</div>
        </div>
      </div>

      <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
        <div className="card-head">
          <h3>Current Version</h3>
          <span className="badge badge-green">Live</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "var(--pink-100)", borderRadius: "var(--radius-sm)" }}>
            <div>
              <div style={{ fontWeight: 600 }}>v2.1.0</div>
              <div style={{ fontSize: 12, color: "var(--ink-500)" }}>Released: May 26, 2025</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13 }}>Admin dashboard overhaul</div>
              <div style={{ fontSize: 11, color: "var(--ink-500)" }}>17 new admin pages</div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card card-pad">
        <div className="card-head">
          <h3>Version History</h3>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Version</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Released</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Changes</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td style={{ padding: "12px 8px", fontWeight: 600 }}>v2.0.5</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>May 20, 2025</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>Bug fixes and performance improvements</td>
              <td style={{ padding: "12px 8px" }}><span className="badge badge-amber">Deprecated</span></td>
              <td style={{ padding: "12px 8px" }}>
                <button className="btn btn-ghost" style={{ padding: "6px 10px" }}>
                  <Icon name="eye" size={16} />
                </button>
              </td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td style={{ padding: "12px 8px", fontWeight: 600 }}>v2.0.4</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>May 15, 2025</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>Payment gateway integration</td>
              <td style={{ padding: "12px 8px" }}><span className="badge badge-amber">Deprecated</span></td>
              <td style={{ padding: "12px 8px" }}>
                <button className="btn btn-ghost" style={{ padding: "6px 10px" }}>
                  <Icon name="eye" size={16} />
                </button>
              </td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td style={{ padding: "12px 8px", fontWeight: 600 }}>v2.0.0</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>May 1, 2025</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>Major release - Multi-currency support</td>
              <td style={{ padding: "12px 8px" }}><span className="badge badge-red">Archived</span></td>
              <td style={{ padding: "12px 8px" }}>
                <button className="btn btn-ghost" style={{ padding: "6px 10px" }}>
                  <Icon name="eye" size={16} />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
