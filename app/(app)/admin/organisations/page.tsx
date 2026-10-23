"use client";

import { useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";

export default function AdminOrganisationsPage() {
  const [activeTab, setActiveTab] = useState<"corporates" | "contracts" | "onboarding">("corporates");

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Organisations</h2>
          <p className="section-sub">Corporate clients, onboarding and contracts</p>
        </div>
        <button className="btn btn-primary">
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          Add Organisation
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid var(--card-border)" }}>
        <button
          className={`btn btn-ghost ${activeTab === "corporates" ? "active" : ""}`}
          onClick={() => setActiveTab("corporates")}
        >
          Corporate Clients
        </button>
        <button
          className={`btn btn-ghost ${activeTab === "contracts" ? "active" : ""}`}
          onClick={() => setActiveTab("contracts")}
        >
          Contracts
        </button>
        <button
          className={`btn btn-ghost ${activeTab === "onboarding" ? "active" : ""}`}
          onClick={() => setActiveTab("onboarding")}
        >
          Onboarding
        </button>
      </div>

      {activeTab === "corporates" && (
        <div className="glass-card card-pad">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Organisation</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Employees</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Plan</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Integration</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>Acme Corporation</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>450</td>
                <td style={{ padding: "12px 8px" }}><span className="badge badge-green">Active</span></td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>Enterprise</td>
                <td style={{ padding: "12px 8px" }}><span className="badge badge-green">Connected</span></td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }}><Icon name="edit" size={14} style={{ marginRight: 4 }} />Edit</button>
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>TechCorp Ltd</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>320</td>
                <td style={{ padding: "12px 8px" }}><span className="badge badge-green">Active</span></td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>Professional</td>
                <td style={{ padding: "12px 8px" }}><span className="badge badge-amber">Degraded</span></td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }}><Icon name="edit" size={14} style={{ marginRight: 4 }} />Edit</button>
                </td>
              </tr>
              <tr>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>GlobalHealth Inc</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>477</td>
                <td style={{ padding: "12px 8px" }}><span className="badge badge-blue">Onboarding</span></td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>Enterprise</td>
                <td style={{ padding: "12px 8px" }}><span className="badge badge-amber">Pending</span></td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }}><Icon name="edit" size={14} style={{ marginRight: 4 }} />Edit</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "contracts" && (
        <div className="glass-card card-pad">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Organisation</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Plan</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Monthly Fee</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Start Date</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Renewal</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>Acme Corporation</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>Enterprise</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>$2,500</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>2024-01-15</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>2025-01-15</td>
                <td style={{ padding: "12px 8px" }}><span className="badge badge-green">Active</span></td>
              </tr>
              <tr>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>TechCorp Ltd</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>Professional</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>$1,200</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>2024-03-01</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>2025-03-01</td>
                <td style={{ padding: "12px 8px" }}><span className="badge badge-green">Active</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "onboarding" && (
        <div className="glass-card card-pad">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Organisation</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Contact</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Stage</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Progress</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Assigned</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>GlobalHealth Inc</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>hr@globalhealth.com</td>
                <td style={{ padding: "12px 8px" }}><span className="badge badge-blue">Integration Setup</span></td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>60%</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>John Smith</td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }}><Icon name="edit" size={14} style={{ marginRight: 4 }} />Edit</button>
                </td>
              </tr>
              <tr>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>StartupXYZ</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>admin@startupxyz.com</td>
                <td style={{ padding: "12px 8px" }}><span className="badge badge-amber">Contract Review</span></td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>30%</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>Sarah Jones</td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }}><Icon name="edit" size={14} style={{ marginRight: 4 }} />Edit</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
