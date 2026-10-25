"use client";

import Icon from "@/components/Icon";
import { useCrud } from "@/lib/useCrud";

interface Entry {
  date: string;
  description: string;
  type: string;
  amount: string;
}

const ENTRIES_DATA: Entry[] = [
  { date: "2025-05-26", description: "User Subscription Payment", type: "Income", amount: "$1.00" },
  { date: "2025-05-25", description: "AWS Infrastructure", type: "Expense", amount: "$245.00" },
];

export default function AccountingPage() {
  const crud = useCrud(ENTRIES_DATA, "Entry");
  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Accounting</h2>
          <p className="section-sub">Financial records and accounting</p>
        </div>
        <button className="btn btn-primary" onClick={() => crud.openModal("create")}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          New Entry
        </button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value">$45,850</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Expenses</div>
          <div className="stat-value">$12,340</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Net Profit</div>
          <div className="stat-value">$33,510</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Pending Invoices</div>
          <div className="stat-value">8</div>
        </div>
      </div>

      <div className="glass-card card-pad">
        <div className="card-head">
          <h3>Recent Transactions</h3>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Date</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Description</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Type</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {crud.items.map((e, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)", cursor: "pointer" }} onClick={() => crud.openModal("view", e, idx)}>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{e.date}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{e.description}</td>
                <td style={{ padding: "12px 8px" }}><span className={`badge ${e.type === "Income" ? "badge-green" : "badge-red"}`}>{e.type}</span></td>
                <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 600 }}>{e.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {crud.modalNode}
    </>
  );
}
