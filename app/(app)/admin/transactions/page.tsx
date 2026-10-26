"use client";

import { useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import RecordModal, { RowRecord } from "@/components/RecordModal";
import { downloadCsv } from "@/lib/download";

interface PlatformTransaction {
  id: string;
  user: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  date: string;
  method: string;
}

export default function AdminTransactionsPage() {
  const { toast } = useAppData();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [viewing, setViewing] = useState<RowRecord | null>(null);

  const mockTransactions: PlatformTransaction[] = [];

  const filteredTransactions = mockTransactions.filter(t => {
    const matchesSearch = t.user.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalVolume = mockTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = mockTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = mockTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Platform Transactions</h2>
          <p className="section-sub">Monitor all user transactions across the platform</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          downloadCsv("platform-transactions.csv", filteredTransactions.map((t) => ({ id: t.id, user: t.user, type: t.type, category: t.category, amount: String(t.amount), date: t.date, method: t.method })));
          toast(`${filteredTransactions.length} transactions exported`, "download");
        }}>
          <Icon name="download" size={16} style={{ marginRight: 8 }} />
          Export Data
        </button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">Total Volume</div>
          <div className="stat-value">${totalVolume.toLocaleString()}</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Total Income</div>
          <div className="stat-value">${totalIncome.toLocaleString()}</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value">${totalExpenses.toLocaleString()}</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Transaction Count</div>
          <div className="stat-value">{mockTransactions.length}</div>
        </div>
      </div>

      <div className="glass-card card-pad">
        <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)" }}
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "all" | "income" | "expense")}
            style={{ padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)" }}
          >
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expenses</option>
          </select>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>User</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Type</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Category</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Amount</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Date</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Method</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((t) => (
              <tr key={t.id} style={{ borderBottom: "1px solid var(--card-border)", cursor: "pointer" }} onClick={() => setViewing({ user: t.user, type: t.type, category: t.category, amount: `$${t.amount.toFixed(2)}`, date: t.date, method: t.method })}>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{t.user}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${t.type === "income" ? "badge-green" : "badge-red"}`}>
                    {t.type}
                  </span>
                </td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{t.category}</td>
                <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 600 }}>
                  {t.type === "income" ? "+" : "-"}${t.amount.toFixed(2)}
                </td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{t.date}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{t.method}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {viewing && <RecordModal mode="view" title="Transaction Details" record={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}
