"use client";

import { useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";

export default function AdminPeoplePage() {
  const [activeTab, setActiveTab] = useState<"individuals" | "employees" | "staff">("individuals");

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">People</h2>
          <p className="section-sub">Individuals, employees and internal staff</p>
        </div>
        <button className="btn btn-primary">
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          Add Person
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid var(--card-border)" }}>
        <button
          className={`btn btn-ghost ${activeTab === "individuals" ? "active" : ""}`}
          onClick={() => setActiveTab("individuals")}
        >
          Individual Clients</button>
        <button
          className={`btn btn-ghost ${activeTab === "employees" ? "active" : ""}`}
          onClick={() => setActiveTab("employees")}
        >
          Corporate Employees</button>
        <button
          className={`btn btn-ghost ${activeTab === "staff" ? "active" : ""}`}
          onClick={() => setActiveTab("staff")}
        >
          Internal Staff</button>
      </div>

      {activeTab === "individuals" && (
        <div className="glass-card card-pad">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Name</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Email</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Plan</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Expiry</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>John Doe</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>john.doe@email.com</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>Individual ($1/yr)</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>2025-12-31</td>
                <td style={{ padding: "12px 8px" }}><span className="badge badge-green">Active</span></td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }}><Icon name="edit" size={14} style={{ marginRight: 4 }} />Edit</button>
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>Sarah Smith</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>sarah.smith@email.com</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>Individual ($1/yr)</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>2025-05-15</td>
                <td style={{ padding: "12px 8px" }}><span className="badge badge-red">Expired</span></td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }}><Icon name="edit" size={14} style={{ marginRight: 4 }} />Edit</button>
                </td>
              </tr>
              <tr>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>Mike Johnson</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>mike.j@email.com</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>Individual ($1/yr)</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>2026-01-20</td>
                <td style={{ padding: "12px 8px" }}><span className="badge badge-green">Active</span></td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }}><Icon name="edit" size={14} style={{ marginRight: 4 }} />Edit</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "employees" && (
        <div className="glass-card card-pad">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Name</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Email</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Organisation</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Department</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>Emma Wilson</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>emma.wilson@acme.com</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>Acme Corporation</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>Engineering</td>
                <td style={{ padding: "12px 8px" }}><span className="badge badge-green">Active</span></td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }}><Icon name="edit" size={14} style={{ marginRight: 4 }} />Edit</button>
                </td>
              </tr>
              <tr>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>David Brown</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>david.brown@techcorp.com</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>TechCorp Ltd</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>Sales</td>
                <td style={{ padding: "12px 8px" }}><span className="badge badge-green">Active</span></td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }}><Icon name="edit" size={14} style={{ marginRight: 4 }} />Edit</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "staff" && (
        <div className="glass-card card-pad">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Name</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Email</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Role</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Department</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>John Smith</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>john.smith@drpt.com</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>Operations Manager</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>Operations</td>
                <td style={{ padding: "12px 8px" }}><span className="badge badge-green">Active</span></td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }}><Icon name="edit" size={14} style={{ marginRight: 4 }} />Edit</button>
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>Sarah Jones</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>sarah.jones@drpt.com</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>Finance Officer</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>Finance</td>
                <td style={{ padding: "12px 8px" }}><span className="badge badge-green">Active</span></td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }}><Icon name="edit" size={14} style={{ marginRight: 4 }} />Edit</button>
                </td>
              </tr>
              <tr>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>Mike Davis</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>mike.davis@drpt.com</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>Support Admin</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>Support</td>
                <td style={{ padding: "12px 8px" }}><span className="badge badge-green">Active</span></td>
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
