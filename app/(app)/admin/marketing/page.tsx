"use client";

import { useCrud } from "@/lib/useCrud";
import Icon from "@/components/Icon";

interface Campaign {
  name: string;
  platform: string;
  reach: string;
  conversions: string;
  status: string;
}

const CAMPAIGNS_DATA: Campaign[] = [];

export default function MarketingPage() {
  const crud = useCrud(CAMPAIGNS_DATA, "Campaign");
  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Marketing</h2>
          <p className="section-sub">Manage marketing campaigns</p>
        </div>
        <button className="btn btn-primary" onClick={() => crud.openModal("create")}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          New Campaign
        </button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">Active Campaigns</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Total Reach</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Conversions</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Spend</div>
          <div className="stat-value">—</div>
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
            {crud.items.map((c, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)", cursor: "pointer" }} onClick={() => crud.openModal("view", c, idx)}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{c.name}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{c.platform}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{c.reach}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{c.conversions}</td>
                <td style={{ padding: "12px 8px" }}><span className={`badge ${c.status === "Active" ? "badge-green" : "badge-amber"}`}>{c.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {crud.modalNode}
    </>
  );
}
