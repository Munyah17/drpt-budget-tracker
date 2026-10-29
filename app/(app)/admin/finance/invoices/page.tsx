"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { useCrud } from "@/lib/useCrud";
import { downloadBlob } from "@/lib/download";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

interface Invoice {
  invoiceId: string;
  organisation: string;
  amount: string;
  dueDate: string;
  status: string;
}

const INVOICES_DATA: Invoice[] = [];

export default function AdminInvoicesPage() {
  const t = useTranslations("Pages.adm_finance_invoices");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const crud = useCrud(INVOICES_DATA, "Invoice");
  const { toast } = useAppData();

  const filteredData = useMemo(() => {
    return crud.items.filter((invoice) =>
      (!statusFilter || invoice.status === statusFilter) &&
      (invoice.invoiceId.toLowerCase().includes(search.toLowerCase()) || invoice.organisation.toLowerCase().includes(search.toLowerCase()))
    );
  }, [crud.items, search, statusFilter]);

  const handleDownload = (invoice: Invoice) => {
    downloadBlob(
      `invoice-${invoice.invoiceId}.txt`,
      t("downloadContent", {
        id: invoice.invoiceId,
        organisation: invoice.organisation,
        amount: invoice.amount,
        dueDate: invoice.dueDate,
        status: invoice.status,
      })
    );
    toast(t("toastDownloaded", { id: invoice.invoiceId }), "download");
  };

  const handleSend = (invoice: Invoice) => {
    toast(t("toastReminderSent", { id: invoice.invoiceId }), "send");
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={() => crud.openModal("create")}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          {t("createInvoice")}
        </button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statTotalOutstanding")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statOverdue")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statThisMonth")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statPaidThisMonth")}</div>
          <div className="stat-value">—</div>
        </div>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder={t("searchPlaceholder")}
          statusOptions={[{ value: "Paid", label: t("statusPaid") }, { value: "Overdue", label: t("statusOverdue") }, { value: "Pending", label: t("statusPending") }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thInvoice")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thOrganisation")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thAmount")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thDueDate")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thStatus")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thActions")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  {t("emptyState")}
                </td>
              </tr>
            )}
            {filteredData.map((invoice, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{invoice.invoiceId}</td>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{invoice.organisation}</td>
                <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 600 }}>{invoice.amount}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{invoice.dueDate}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${invoice.status === "Paid" ? "badge-green" : invoice.status === "Overdue" ? "badge-red" : "badge-blue"}`}>
                    {invoice.status}
                  </span>
                </td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleDownload(invoice)}><Icon name="download" size={14} style={{ marginRight: 4 }} />{t("download")}</button>
                  {invoice.status !== "Paid" && (
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleSend(invoice)}><Icon name="send" size={14} style={{ marginRight: 4 }} />{t("remind")}</button>
                  )}
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => crud.openModal("view", invoice, crud.items.indexOf(invoice))}><Icon name="eye" size={14} style={{ marginRight: 4 }} />{t("view")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {crud.modalNode}
    </>
  );
}
