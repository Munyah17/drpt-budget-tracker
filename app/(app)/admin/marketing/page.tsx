"use client";

import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";

export default function MarketingPage() {
  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Marketing</h2>
          <p className="section-sub">Manage marketing campaigns</p>
        </div>
        <button className="btn btn-primary">
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          New Campaign
        </button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">Active Campaigns</div>
          <div className="stat-value">5</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Total Reach</div>
          <div className="stat-value">12.5K</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Conversions</div>
          <div className="stat-value">8.2%</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Spend</div>
          <div className="stat-value">$2,450</div>
        </div>
      </div>

      <div className="glass-card card-pad">
        <div className="card-head">
          <h3>Active Campaigns</h3>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Campaign</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Platform</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Reach</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Conversions</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td style={{ padding: "12px 8px", fontWeight: 600 }}>Summer Promo</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>Facebook</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>5,200</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>412</td>
              <td style={{ padding: "12px 8px" }}><span className="badge badge-green">Active</span></td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td style={{ padding: "12px 8px", fontWeight: 600 }}>Email Blast</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>Email</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>3,100</td>
              <td style={{ padding: "12px 8px", fontSize: 13 }}>287</td>
              <td style={{ padding: "12px 8px" }}><span className="badge badge-green">Active</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
