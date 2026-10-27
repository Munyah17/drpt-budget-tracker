"use client";

import { useState, useMemo } from "react";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";
import { useAppData } from "@/lib/AppDataContext";
import { buildPayslipDoc, openPayslipPdf, payslipTotals, usd, PayslipDoc } from "@/lib/payslip";

interface Payslip {
  period: string;
  payDate: string;
  status: string;
  doc: PayslipDoc;
}

const PAYSLIP_PERIODS: Omit<Payslip, "doc">[] = [
  { period: "August 2026", payDate: "Aug 25, 2026", status: "Paid" },
  { period: "September 2026", payDate: "Sep 25, 2026", status: "Paid" },
  { period: "October 2026", payDate: "Oct 25, 2026", status: "Pending" },
];

export default function EmployeePayslipsPage() {
  const { user, toast } = useAppData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const payslips = useMemo<Payslip[]>(
    () =>
      PAYSLIP_PERIODS.map((p) => ({
        ...p,
        doc: buildPayslipDoc({
          employee: user?.name ?? "Emma Wilson",
          period: p.period,
          company: user?.organisation ?? undefined,
        }),
      })),
    [user]
  );

  const filteredData = useMemo(() => {
    return payslips.filter((p) =>
      (!statusFilter || p.status === statusFilter) &&
      p.period.toLowerCase().includes(search.toLowerCase())
    );
  }, [payslips, search, statusFilter]);

  const handleDownload = (p: Payslip) => {
    openPayslipPdf(p.doc);
    toast(`Payslip for ${p.period} opened — save as PDF`, "download");
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
            {filteredData.map((p, idx) => {
              const t = payslipTotals(p.doc);
              return (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{p.period}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{usd(t.gross)}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{usd(t.deductions)}</td>
                <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 600 }}>{usd(t.net)}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{p.payDate}</td>
                <td style={{ padding: "12px 8px" }}><span className={`badge ${p.status === "Paid" ? "badge-green" : "badge-amber"}`}>{p.status}</span></td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleDownload(p)}><Icon name="download" size={14} style={{ marginRight: 4 }} />PDF</button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
