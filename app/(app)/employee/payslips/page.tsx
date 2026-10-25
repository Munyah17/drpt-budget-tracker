"use client";

import { useState, useMemo } from "react";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";
import { useAppData } from "@/lib/AppDataContext";
import { downloadBlob } from "@/lib/download";

interface Payslip {
  period: string;
  gross: string;
  deductions: string;
  net: string;
  payDate: string;
  status: string;
}

const PAYSLIPS_DATA: Payslip[] = [
  { period: "May 2025", gross: "$5,200", deductions: "$1,310", net: "$3,890", payDate: "2025-05-28", status: "Paid" },
  { period: "April 2025", gross: "$5,200", deductions: "$1,310", net: "$3,890", payDate: "2025-04-28", status: "Paid" },
  { period: "March 2025", gross: "$5,150", deductions: "$1,295", net: "$3,855", payDate: "2025-03-28", status: "Paid" },
  { period: "February 2025", gross: "$5,150", deductions: "$1,295", net: "$3,855", payDate: "2025-02-28", status: "Paid" },
];

export default function EmployeePayslipsPage() {
  const { user, toast } = useAppData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filteredData = useMemo(() => {
    return PAYSLIPS_DATA.filter((p) =>
      (!statusFilter || p.status === statusFilter) &&
      p.period.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, statusFilter]);

  const handleDownload = (p: Payslip) => {
    downloadBlob(
      `payslip-${p.period.replace(/\s+/g, "-").toLowerCase()}.txt`,
      `PAYSLIP — ${p.period}\nEmployer: ${user?.organisation ?? "Organisation"}\nEmployee: ${user?.name ?? "Employee"}\n\nGross Pay: ${p.gross}\nDeductions: ${p.deductions}\nNet Pay: ${p.net}\nPay Date: ${p.payDate}\nStatus: ${p.status}\n`
    );
    toast(`Payslip for ${p.period} downloaded`, "download");
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">My Payslips</h2>
          <p className="section-sub">Issued by {user?.organisation ?? "your organisation"}</p>
        </div>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder="Search payslips..."
          statusOptions={[{ value: "Paid", label: "Paid" }, { value: "Pending", label: "Pending" }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Period</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Gross</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Deductions</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Net Pay</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Pay Date</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  No payslips match your search.
                </td>
              </tr>
            )}
            {filteredData.map((p, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{p.period}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{p.gross}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{p.deductions}</td>
                <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 600 }}>{p.net}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{p.payDate}</td>
                <td style={{ padding: "12px 8px" }}><span className="badge badge-green">{p.status}</span></td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleDownload(p)}><Icon name="download" size={14} style={{ marginRight: 4 }} />Download</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
