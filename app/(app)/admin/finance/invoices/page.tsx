"use client";

import { useState, useMemo } from "react";
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
      `INVOICE ${invoice.invoiceId}\nOrganisation: ${invoice.organisation}\nAmount: ${invoice.amount}\nDue: ${invoice.dueDate}\nStatus: ${invoice.status}\n`
    );
    toast(`Invoice ${invoice.invoiceId} downloaded`, "download");
  };

  const handleSend = (invoice: Invoice) => {
    toast(`Payment reminder sent for ${invoice.invoiceId}`, "send");
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Invoices</h2>
          <p className="section-sub">Manage client invoices</p>
        </div>
        <button className="btn btn-primary" onClick={() => crud.openModal("create")}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          Create Invoice
        </button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">Total Outstanding</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Overdue</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">This Month</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Paid This Month</div>
          <div className="stat-value">—</div>
        </div>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder="Search invoices..."
          statusOptions={[{ value: "Paid", label: "Paid" }, { value: "Overdue", label: "Overdue" }, { value: "Pending", label: "Pending" }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
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
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  No invoices match your search.
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
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleDownload(invoice)}><Icon name="download" size={14} style={{ marginRight: 4 }} />Download</button>
                  {invoice.status !== "Paid" && (
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleSend(invoice)}><Icon name="send" size={14} style={{ marginRight: 4 }} />Remind</button>
                  )}
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => crud.openModal("view", invoice, crud.items.indexOf(invoice))}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
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
