"use client";

import { useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";

export default function AdminFinancePage() {
  const [activeTab, setActiveTab] = useState<"invoices" | "payments" | "subscriptions">("invoices");

  const handleDownload = (item: string) => {
    alert(`Downloading ${item}...`);
  };

  const handleSend = (item: string) => {
    alert(`Sending reminder for ${item}...`);
  };

  const handleEdit = (item: string) => {
    alert(`Editing ${item}...`);
  };

  const handleRenew = (item: string) => {
    alert(`Renewing ${item}...`);
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Finance</h2>
          <p className="section-sub">Accounting, invoices, subscriptions and revenue</p>
        </div>
        <button className="btn btn-primary">
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          Create Invoice
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid var(--card-border)" }}>
        <button
          className={`btn btn-ghost ${activeTab === "invoices" ? "active" : ""}`}
          onClick={() => setActiveTab("invoices")}
        >
          Invoices</button>
        <button
          className={`btn btn-ghost ${activeTab === "payments" ? "active" : ""}`}
          onClick={() => setActiveTab("payments")}
        >
          Payments</button>
        <button
          className={`btn btn-ghost ${activeTab === "subscriptions" ? "active" : ""}`}
          onClick={() => setActiveTab("subscriptions")}
        >
          Subscriptions</button>
      </div>

      {activeTab === "invoices" && (
        <>
          <div className="grid grid-4" style={{ marginBottom: 20 }}>
            <div className="glass-card card-pad">
              <div className="stat-label">Total Outstanding</div>
              <div className="stat-value">$12,450</div>
            </div>
            <div className="glass-card card-pad">
              <div className="stat-label">Overdue</div>
              <div className="stat-value">$4,500</div>
            </div>
            <div className="glass-card card-pad">
              <div className="stat-label">This Month</div>
              <div className="stat-value">$8,950</div>
            </div>
            <div className="glass-card card-pad">
              <div className="stat-label">Paid This Month</div>
              <div className="stat-value">$15,200</div>
            </div>
          </div>

          <div className="glass-card card-pad">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
                  <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Invoice #</th>
                  <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Organisation</th>
                  <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Amount</th>
                  <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Due Date</th>
                  <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
                  <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <td style={{ padding: "12px 8px", fontSize: 13 }}>INV-2025-0526-001</td>
                  <td style={{ padding: "12px 8px", fontWeight: 600 }}>Acme Corporation</td>
                  <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 600 }}>$2,500</td>
                  <td style={{ padding: "12px 8px", fontSize: 13 }}>2025-06-15</td>
                  <td style={{ padding: "12px 8px" }}><span className="badge badge-green">Paid</span></td>
                  <td style={{ padding: "12px 8px" }}>
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleDownload("INV-2025-0526-001")}><Icon name="download" size={14} style={{ marginRight: 4 }} />Download</button>
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <td style={{ padding: "12px 8px", fontSize: 13 }}>INV-2025-0526-002</td>
                  <td style={{ padding: "12px 8px", fontWeight: 600 }}>TechCorp Ltd</td>
                  <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 600 }}>$4,500</td>
                  <td style={{ padding: "12px 8px", fontSize: 13 }}>2025-05-11</td>
                  <td style={{ padding: "12px 8px" }}><span className="badge badge-red">Overdue</span></td>
                  <td style={{ padding: "12px 8px" }}>
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleDownload("INV-2025-0526-002")}><Icon name="download" size={14} style={{ marginRight: 4 }} />Download</button>
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleSend("INV-2025-0526-002")}><Icon name="send" size={14} style={{ marginRight: 4 }} />Remind</button>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "12px 8px", fontSize: 13 }}>INV-2025-0526-003</td>
                  <td style={{ padding: "12px 8px", fontWeight: 600 }}>GlobalHealth Inc</td>
                  <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 600 }}>$7,950</td>
                  <td style={{ padding: "12px 8px", fontSize: 13 }}>2025-06-30</td>
                  <td style={{ padding: "12px 8px" }}><span className="badge badge-blue">Pending</span></td>
                  <td style={{ padding: "12px 8px" }}>
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleDownload("INV-2025-0526-003")}><Icon name="download" size={14} style={{ marginRight: 4 }} />Download</button>
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleSend("INV-2025-0526-003")}><Icon name="send" size={14} style={{ marginRight: 4 }} />Remind</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "payments" && (
        <div className="glass-card card-pad">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Payment ID</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Organisation</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Amount</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Method</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Date</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>PAY-2025-0526-001</td>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>Acme Corporation</td>
                <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 600 }}>$2,500</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>Bank Transfer</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>2025-05-26</td>
                <td style={{ padding: "12px 8px" }}><span className="badge badge-green">Completed</span></td>
              </tr>
              <tr>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>PAY-2025-0525-001</td>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>TechCorp Ltd</td>
                <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 600 }}>$1,200</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>Credit Card</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>2025-05-25</td>
                <td style={{ padding: "12px 8px" }}><span className="badge badge-green">Completed</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "subscriptions" && (
        <div className="glass-card card-pad">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>User</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Plan</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Start Date</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Expiry</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>John Doe</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>Individual ($1/yr)</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>2024-12-31</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>2025-12-31</td>
                <td style={{ padding: "12px 8px" }}><span className="badge badge-green">Active</span></td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleEdit("John Doe")}><Icon name="edit" size={14} style={{ marginRight: 4 }} />Edit</button>
                </td>
              </tr>
              <tr>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>Sarah Smith</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>Individual ($1/yr)</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>2024-05-15</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>2025-05-15</td>
                <td style={{ padding: "12px 8px" }}><span className="badge badge-red">Expired</span></td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleEdit("Sarah Smith")}><Icon name="edit" size={14} style={{ marginRight: 4 }} />Edit</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleRenew("Sarah Smith")}><Icon name="refresh-cw" size={14} style={{ marginRight: 4 }} />Renew</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
