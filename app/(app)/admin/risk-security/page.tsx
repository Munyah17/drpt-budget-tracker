"use client";

import { useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";

export default function AdminRiskSecurityPage() {
  const [activeTab, setActiveTab] = useState<"audit" | "access" | "incidents">("audit");

  const handleEdit = (item: string) => {
    alert(`Editing ${item}...`);
  };

  const handleView = (item: string) => {
    alert(`Viewing ${item}...`);
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Risk & Security</h2>
          <p className="section-sub">Access control, audit and compliance</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid var(--card-border)" }}>
        <button
          className={`btn btn-ghost ${activeTab === "audit" ? "active" : ""}`}
          onClick={() => setActiveTab("audit")}
        >
          Audit Logs</button>
        <button
          className={`btn btn-ghost ${activeTab === "access" ? "active" : ""}`}
          onClick={() => setActiveTab("access")}
        >
          Access Control</button>
        <button
          className={`btn btn-ghost ${activeTab === "incidents" ? "active" : ""}`}
          onClick={() => setActiveTab("incidents")}
        >
          Incidents</button>
      </div>

      {activeTab === "audit" && (
        <div className="glass-card card-pad">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Timestamp</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>User</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Action</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Resource</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>IP Address</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>2025-05-26 15:30:45</td>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>john.smith@drpt.com</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>Updated payroll batch</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>BCH-2025-0526-001</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>192.168.1.100</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>2025-05-26 15:15:22</td>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>sarah.jones@drpt.com</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>Generated invoice</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>INV-2025-0526-003</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>192.168.1.105</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>2025-05-26 14:45:10</td>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>admin@drpt.com</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>Modified user role</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>john.doe@email.com</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>192.168.1.50</td>
              </tr>
              <tr>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>2025-05-26 14:30:00</td>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>emma.wilson@acme.com</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>Viewed payslip</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>Payslip-May-2025</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>10.0.0.45</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "access" && (
        <div className="glass-card card-pad">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Role</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Permissions</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Users</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>Super Admin</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>Full platform access</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>2</td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleEdit("Super Admin")}><Icon name="edit" size={14} style={{ marginRight: 4 }} />Edit</button>
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>Operations Manager</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>Payroll, exceptions, reconciliation</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>5</td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleEdit("Operations Manager")}><Icon name="edit" size={14} style={{ marginRight: 4 }} />Edit</button>
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>Finance Officer</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>Invoices, payments, reconciliation</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>3</td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleEdit("Finance Officer")}><Icon name="edit" size={14} style={{ marginRight: 4 }} />Edit</button>
                </td>
              </tr>
              <tr>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>Corporate Admin</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>Organisation management, employees</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>12</td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleEdit("Corporate Admin")}><Icon name="edit" size={14} style={{ marginRight: 4 }} />Edit</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "incidents" && (
        <>
          <div className="grid grid-4" style={{ marginBottom: 20 }}>
            <div className="glass-card card-pad">
              <div className="stat-label">Open</div>
              <div className="stat-value">3</div>
            </div>
            <div className="glass-card card-pad">
              <div className="stat-label">Investigating</div>
              <div className="stat-value">2</div>
            </div>
            <div className="glass-card card-pad">
              <div className="stat-label">Resolved (7d)</div>
              <div className="stat-value">8</div>
            </div>
            <div className="glass-card card-pad">
              <div className="stat-label">Critical</div>
              <div className="stat-value">1</div>
            </div>
          </div>

          <div className="glass-card card-pad">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
                  <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Incident ID</th>
                  <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Type</th>
                  <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Severity</th>
                  <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
                  <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Assigned</th>
                  <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <td style={{ padding: "12px 8px", fontSize: 13 }}>INC-2025-0526-001</td>
                  <td style={{ padding: "12px 8px", fontSize: 13 }}>Unusual login activity</td>
                  <td style={{ padding: "12px 8px" }}><span className="badge badge-red">Critical</span></td>
                  <td style={{ padding: "12px 8px" }}><span className="badge badge-amber">Investigating</span></td>
                  <td style={{ padding: "12px 8px", fontSize: 13 }}>Security Team</td>
                  <td style={{ padding: "12px 8px" }}>
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleView("INC-2025-0526-001")}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <td style={{ padding: "12px 8px", fontSize: 13 }}>INC-2025-0525-001</td>
                  <td style={{ padding: "12px 8px", fontSize: 13 }}>API rate limit exceeded</td>
                  <td style={{ padding: "12px 8px" }}><span className="badge badge-amber">High</span></td>
                  <td style={{ padding: "12px 8px" }}><span className="badge badge-blue">Open</span></td>
                  <td style={{ padding: "12px 8px", fontSize: 13 }}>Tech Team</td>
                  <td style={{ padding: "12px 8px" }}>
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleView("INC-2025-0525-001")}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "12px 8px", fontSize: 13 }}>INC-2025-0524-001</td>
                  <td style={{ padding: "12px 8px", fontSize: 13 }}>Failed webhook delivery</td>
                  <td style={{ padding: "12px 8px" }}><span className="badge badge-blue">Medium</span></td>
                  <td style={{ padding: "12px 8px" }}><span className="badge badge-green">Resolved</span></td>
                  <td style={{ padding: "12px 8px", fontSize: 13 }}>Ops Team</td>
                  <td style={{ padding: "12px 8px" }}>
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleView("INC-2025-0524-001")}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
