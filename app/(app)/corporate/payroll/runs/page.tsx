"use client";

import { useState, useMemo } from "react";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

interface PayrollRun {
  runId: string;
  period: string;
  employees: string;
  totalAmount: string;
  status: string;
  payDate: string;
}

const RUNS_DATA: PayrollRun[] = [
  { runId: "RUN-2025-06", period: "June 2025", employees: "450", totalAmount: "£415,700", status: "Scheduled", payDate: "2025-06-28" },
  { runId: "RUN-2025-05", period: "May 2025", employees: "448", totalAmount: "£412,300", status: "Paid", payDate: "2025-05-28" },
  { runId: "RUN-2025-04", period: "April 2025", employees: "445", totalAmount: "£408,950", status: "Paid", payDate: "2025-04-28" },
];

export default function CorporatePayrollRunsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filteredData = useMemo(() => {
    return RUNS_DATA.filter((run) =>
      (!statusFilter || run.status === statusFilter) &&
      (run.runId.toLowerCase().includes(search.toLowerCase()) || run.period.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search, statusFilter]);

  const handleView = (item: string) => alert(`Viewing ${item}...`);

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Payroll Runs</h2>
          <p className="section-sub">Manage and track payroll processing</p>
        </div>
        <button className="btn btn-primary">
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          New Payroll Run
        </button>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder="Search payroll runs..."
          statusOptions={[{ value: "Scheduled", label: "Scheduled" }, { value: "Paid", label: "Paid" }, { value: "Processing", label: "Processing" }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Run ID</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Period</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Employees</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Total Amount</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Pay Date</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  No payroll runs match your search.
                </td>
              </tr>
            )}
            {filteredData.map((run, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{run.runId}</td>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{run.period}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{run.employees}</td>
                <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 600 }}>{run.totalAmount}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${run.status === "Paid" ? "badge-green" : run.status === "Scheduled" ? "badge-blue" : "badge-amber"}`}>
                    {run.status}
                  </span>
                </td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{run.payDate}</td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleView(run.runId)}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
