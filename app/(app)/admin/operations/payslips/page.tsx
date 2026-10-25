"use client";

import { useState, useMemo } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

import { useCrud } from "@/lib/useCrud";
interface Payslip {
  employee: string;
  organisation: string;
  period: string;
  status: string;
  delivered: string;
}

const PAYSLIPS_DATA: Payslip[] = [
  { employee: "Emma Wilson", organisation: "Acme Corporation", period: "May 2025", status: "Delivered", delivered: "2025-05-26 15:00" },
  { employee: "David Brown", organisation: "TechCorp Ltd", period: "May 2025", status: "Pending", delivered: "-" },
];

export default function AdminPayslipsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const crud = useCrud(PAYSLIPS_DATA, "Payslip");

  const { toast } = useAppData();
  const filteredData = useMemo(() => {
    return crud.items.filter((payslip) =>
      (!statusFilter || payslip.status === statusFilter) &&
      (payslip.employee.toLowerCase().includes(search.toLowerCase()) || payslip.organisation.toLowerCase().includes(search.toLowerCase()))
    );
  }, [crud.items, search, statusFilter]);

  const handleDownload = (item: string) => {
    toast(`Downloading ${item}...`);
  };

  const handleSend = (item: string) => {
    toast(`Sending ${item}...`);
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Payslip Delivery</h2>
          <p className="section-sub">Manage payslip distribution</p>
        </div>
        <button className="btn btn-primary" onClick={() => crud.openModal("create")}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          Generate Payslips
        </button>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder="Search payslips..."
          statusOptions={[{ value: "Delivered", label: "Delivered" }, { value: "Pending", label: "Pending" }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
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
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  No payslips match your search.
                </td>
              </tr>
            )}
            {filteredData.map((payslip, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{payslip.employee}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{payslip.organisation}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{payslip.period}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${payslip.status === "Delivered" ? "badge-green" : "badge-amber"}`}>
                    {payslip.status}
                  </span>
                </td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{payslip.delivered}</td>
                <td style={{ padding: "12px 8px" }}>
                  {payslip.status === "Delivered" ? (
                    <>
                      <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleDownload(payslip.employee)}><Icon name="download" size={14} style={{ marginRight: 4 }} />Download</button>
                      <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleSend(payslip.employee)}><Icon name="send" size={14} style={{ marginRight: 4 }} />Resend</button>
                    </>
                  ) : (
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleSend(payslip.employee)}><Icon name="send" size={14} style={{ marginRight: 4 }} />Send</button>
                  )}
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
