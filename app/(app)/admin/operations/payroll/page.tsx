"use client";

import { useState, useMemo } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

interface PayrollBatch {
  batchId: string;
  organisation: string;
  employees: string;
  status: string;
  submitted: string;
}

const PAYROLL_DATA: PayrollBatch[] = [
  { batchId: "BCH-2025-0526-001", organisation: "Acme Corporation", employees: "450", status: "Processing", submitted: "2025-05-26 14:30" },
  { batchId: "BCH-2025-0526-002", organisation: "TechCorp Ltd", employees: "320", status: "Completed", submitted: "2025-05-26 12:15" },
  { batchId: "BCH-2025-0526-003", organisation: "GlobalHealth Inc", employees: "477", status: "Failed", submitted: "2025-05-26 10:45" },
];

export default function AdminPayrollPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filteredData = useMemo(() => {
    return PAYROLL_DATA.filter((batch) =>
      (!statusFilter || batch.status === statusFilter) &&
      (batch.batchId.toLowerCase().includes(search.toLowerCase()) || batch.organisation.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search, statusFilter]);

  const handleView = (item: string) => {
    alert(`Viewing ${item}...`);
  };

  const handleRetry = (item: string) => {
    alert(`Retrying ${item}...`);
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Payroll Batches</h2>
          <p className="section-sub">Manage payroll processing batches</p>
        </div>
        <button className="btn btn-primary">
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          New Batch
        </button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">Pending Batches</div>
          <div className="stat-value">5</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">In Processing</div>
          <div className="stat-value">3</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Completed Today</div>
          <div className="stat-value">12</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Failed</div>
          <div className="stat-value">1</div>
        </div>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder="Search batches..."
          statusOptions={[{ value: "Processing", label: "Processing" }, { value: "Completed", label: "Completed" }, { value: "Failed", label: "Failed" }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Batch ID</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Organisation</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Employees</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Submitted</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  No payroll batches match your search.
                </td>
              </tr>
            )}
            {filteredData.map((batch, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{batch.batchId}</td>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{batch.organisation}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{batch.employees}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${batch.status === "Completed" ? "badge-green" : batch.status === "Processing" ? "badge-blue" : "badge-red"}`}>
                    {batch.status}
                  </span>
                </td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{batch.submitted}</td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleView(batch.batchId)}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
                  {batch.status === "Failed" && (
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleRetry(batch.batchId)}><Icon name="refresh-cw" size={14} style={{ marginRight: 4 }} />Retry</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
