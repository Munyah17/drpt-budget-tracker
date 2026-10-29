"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("Pages.adm_transactions");
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
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          downloadCsv("platform-transactions.csv", filteredTransactions.map((row) => ({ id: row.id, user: row.user, type: row.type, category: row.category, amount: String(row.amount), date: row.date, method: row.method })));
          toast(t("toastExported", { count: filteredTransactions.length }), "download");
        }}>
          <Icon name="download" size={16} style={{ marginRight: 8 }} />
          {t("exportData")}
        </button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("totalVolume")}</div>
          <div className="stat-value">${totalVolume.toLocaleString()}</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("totalIncome")}</div>
          <div className="stat-value">${totalIncome.toLocaleString()}</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("totalExpenses")}</div>
          <div className="stat-value">${totalExpenses.toLocaleString()}</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("transactionCount")}</div>
          <div className="stat-value">{mockTransactions.length}</div>
        </div>
      </div>

      <div className="glass-card card-pad">
        <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              placeholder={t("phSearch")}
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
            <option value="all">{t("optAllTypes")}</option>
            <option value="income">{t("optIncome")}</option>
            <option value="expense">{t("optExpenses")}</option>
          </select>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colUser")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colType")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colCategory")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colAmount")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colDate")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colMethod")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((tx) => (
              <tr key={tx.id} style={{ borderBottom: "1px solid var(--card-border)", cursor: "pointer" }} onClick={() => setViewing({ user: tx.user, type: tx.type, category: tx.category, amount: `$${tx.amount.toFixed(2)}`, date: tx.date, method: tx.method })}>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{tx.user}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${tx.type === "income" ? "badge-green" : "badge-red"}`}>
                    {tx.type}
                  </span>
                </td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{tx.category}</td>
                <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 600 }}>
                  {tx.type === "income" ? "+" : "-"}${tx.amount.toFixed(2)}
                </td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{tx.date}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{tx.method}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {viewing && <RecordModal mode="view" title={t("modalTitle")} record={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}
