"use client";

import { useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";

export default function AdminOperationsPage() {
  const [activeTab, setActiveTab] = useState<"payroll" | "payslips" | "exceptions">("payroll");

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Operations</h2>
          <p className="section-sub">Payroll, support, reconciliation and exceptions</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid var(--card-border)" }}>
        <button
          className={`btn btn-ghost ${activeTab === "payroll" ? "active" : ""}`}
          onClick={() => setActiveTab("payroll")}
        >
          Payroll Batches
        </button>
        <button
          className={`btn btn-ghost ${activeTab === "payslips" ? "active" : ""}`}
          onClick={() => setActiveTab("payslips")}
        >
          Payslip Delivery
        </button>
        <button
          className={`btn btn-ghost ${activeTab === "exceptions" ? "active" : ""}`}
          onClick={() => setActiveTab("exceptions")}
        >
          Exceptions & Incidents
        </button>
      </div>

      {activeTab === "payroll" && (
        <>
          <div className="grid grid-4" style={{ marginBottom: 20 }}>
            <div className="glass-card card-pad">
              <div className="stat-label">Pending Batches</div>
              <div className="stat-value">5</div>
            </div>
            <div className="glass-card card-pad">
              <div className="stat-label">In Processing</div>
              <div className="stat-value">3</div>
            </div>
            <div className="glass-card card-pad">
              <div className="stat-label">Completed Today</div>
              <div className="stat-value">12</div>
            </div>
            <div className="glass-card card-pad">
              <div className="stat-label">Failed</div>
              <div className="stat-value">1</div>
            </div>
          </div>

          <div className="glass-card card-pad">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
                  <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Batch ID</th>
                  <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Organisation</th>
                  <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Employees</th>
                  <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
                  <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Submitted</th>
                  <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <td style={{ padding: "12px 8px", fontSize: 13 }}>BCH-2025-0526-001</td>
                  <td style={{ padding: "12px 8px", fontWeight: 600 }}>Acme Corporation</td>
                  <td style={{ padding: "12px 8px", fontSize: 13 }}>450</td>
                  <td style={{ padding: "12px 8px" }}><span className="badge badge-blue">Processing</span></td>
                  <td style={{ padding: "12px 8px", fontSize: 13 }}>2025-05-26 14:30</td>
                  <td style={{ padding: "12px 8px" }}>
                    <button className="btn btn-ghost" style={{ padding: 4 }}><Icon name="eye" size={16} /></button>
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <td style={{ padding: "12px 8px", fontSize: 13 }}>BCH-2025-0526-002</td>
                  <td style={{ padding: "12px 8px", fontWeight: 600 }}>TechCorp Ltd</td>
                  <td style={{ padding: "12px 8px", fontSize: 13 }}>320</td>
                  <td style={{ padding: "12px 8px" }}><span className="badge badge-green">Completed</span></td>
                  <td style={{ padding: "12px 8px", fontSize: 13 }}>2025-05-26 12:15</td>
                  <td style={{ padding: "12px 8px" }}>
                    <button className="btn btn-ghost" style={{ padding: 4 }}><Icon name="eye" size={16} /></button>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "12px 8px", fontSize: 13 }}>BCH-2025-0526-003</td>
                  <td style={{ padding: "12px 8px", fontWeight: 600 }}>GlobalHealth Inc</td>
                  <td style={{ padding: "12px 8px", fontSize: 13 }}>477</td>
                  <td style={{ padding: "12px 8px" }}><span className="badge badge-red">Failed</span></td>
                  <td style={{ padding: "12px 8px", fontSize: 13 }}>2025-05-26 10:45</td>
                  <td style={{ padding: "12px 8px" }}>
                    <button className="btn btn-ghost" style={{ padding: 4 }}><Icon name="eye" size={16} /></button>
                    <button className="btn btn-ghost" style={{ padding: 4 }}><Icon name="refresh-cw" size={16} /></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "payslips" && (
        <div className="glass-card card-pad">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Employee</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Organisation</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Period</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Delivered</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>Emma Wilson</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>Acme Corporation</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>May 2025</td>
                <td style={{ padding: "12px 8px" }}><span className="badge badge-green">Delivered</span></td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>2025-05-26 15:00</td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: 4 }}><Icon name="download" size={16} /></button>
                  <button className="btn btn-ghost" style={{ padding: 4 }}><Icon name="send" size={16} /></button>
                </td>
              </tr>
              <tr>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>David Brown</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>TechCorp Ltd</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>May 2025</td>
                <td style={{ padding: "12px 8px" }}><span className="badge badge-amber">Pending</span></td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>-</td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: 4 }}><Icon name="send" size={16} /></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "exceptions" && (
        <>
          <div className="grid grid-4" style={{ marginBottom: 20 }}>
            <div className="glass-card card-pad">
              <div className="stat-label">Critical</div>
              <div className="stat-value">2</div>
            </div>
            <div className="glass-card card-pad">
              <div className="stat-label">High</div>
              <div className="stat-value">5</div>
            </div>
            <div className="glass-card card-pad">
              <div className="stat-label">Medium</div>
              <div className="stat-value">8</div>
            </div>
            <div className="glass-card card-pad">
              <div className="stat-label">Low</div>
              <div className="stat-value">12</div>
            </div>
          </div>

          <div className="glass-card card-pad">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
                  <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Type</th>
                  <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Description</th>
                  <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Priority</th>
                  <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Assigned</th>
                  <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
                  <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <td style={{ padding: "12px 8px", fontSize: 13 }}>Integration Failure</td>
                  <td style={{ padding: "12px 8px", fontSize: 13 }}>GlobalHealth payroll sync timeout</td>
                  <td style={{ padding: "12px 8px" }}><span className="badge badge-red">Critical</span></td>
                  <td style={{ padding: "12px 8px", fontSize: 13 }}>John Smith</td>
                  <td style={{ padding: "12px 8px" }}><span className="badge badge-amber">In Progress</span></td>
                  <td style={{ padding: "12px 8px" }}>
                    <button className="btn btn-ghost" style={{ padding: 4 }}><Icon name="eye" size={16} /></button>
                    <button className="btn btn-ghost" style={{ padding: 4 }}><Icon name="check" size={16} /></button>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "12px 8px", fontSize: 13 }}>Data Mismatch</td>
                  <td style={{ padding: "12px 8px", fontSize: 13 }}>Acme Corp employee record duplicate</td>
                  <td style={{ padding: "12px 8px" }}><span className="badge badge-amber">High</span></td>
                  <td style={{ padding: "12px 8px", fontSize: 13 }}>Sarah Jones</td>
                  <td style={{ padding: "12px 8px" }}><span className="badge badge-blue">Assigned</span></td>
                  <td style={{ padding: "12px 8px" }}>
                    <button className="btn btn-ghost" style={{ padding: 4 }}><Icon name="eye" size={16} /></button>
                    <button className="btn btn-ghost" style={{ padding: 4 }}><Icon name="check" size={16} /></button>
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
