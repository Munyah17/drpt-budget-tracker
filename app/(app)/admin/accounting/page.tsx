"use client";

import { useTranslations } from "next-intl";
import Icon from "@/components/Icon";
import { useCrud } from "@/lib/useCrud";

interface Entry {
  date: string;
  description: string;
  type: string;
  amount: string;
}

const ENTRIES_DATA: Entry[] = [];

export default function AccountingPage() {
  const t = useTranslations("Pages.adm_accounting");
  const crud = useCrud(ENTRIES_DATA, t("entryLabel"));
  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={() => crud.openModal("create")}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          {t("newEntry")}
        </button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statTotalRevenue")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statExpenses")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statNetProfit")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statPendingInvoices")}</div>
          <div className="stat-value">—</div>
        </div>
      </div>

      <div className="glass-card card-pad">
        <div className="card-head">
          <h3>{t("recentTransactions")}</h3>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colDate")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colDescription")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colType")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colAmount")}</th>
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
