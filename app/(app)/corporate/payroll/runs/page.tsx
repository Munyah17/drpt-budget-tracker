"use client";

import { useState, useMemo } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";
import RecordModal, { RowRecord } from "@/components/RecordModal";

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
  const { toast } = useAppData();
  const [runs, setRuns] = useState<PayrollRun[]>(RUNS_DATA);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState<{ mode: "view" | "edit" | "create"; record: RowRecord; index: number } | null>(null);

  const filteredData = useMemo(() => {
    return runs.filter((run) =>
      (!statusFilter || run.status === statusFilter) &&
      (run.runId.toLowerCase().includes(search.toLowerCase()) || run.period.toLowerCase().includes(search.toLowerCase()))
    );
  }, [runs, search, statusFilter]);

  const openModal = (mode: "view" | "edit" | "create", run?: PayrollRun, index?: number) => {
    const record: RowRecord = run
      ? { runId: run.runId, period: run.period, employees: run.employees, totalAmount: run.totalAmount, status: run.status, payDate: run.payDate }
      : { runId: `RUN-2025-${String(runs.length + 7).padStart(2, "0")}`, period: "", employees: "", totalAmount: "", status: "Scheduled", payDate: "" };
    setModal({ mode, record, index: index ?? -1 });
  };

  const handleSave = (values: RowRecord) => {
    if (!modal) return;
    const run: PayrollRun = { runId: values.runId, period: values.period, employees: values.employees, totalAmount: values.totalAmount, status: values.status || "Scheduled", payDate: values.payDate };
    if (modal.mode === "create") {
      setRuns((prev) => [run, ...prev]);
      toast(`Payroll run ${run.runId} created`);
    } else {
      setRuns((prev) => prev.map((e, i) => (i === modal.index ? run : e)));
      toast(`Payroll run ${run.runId} updated`);
    }
    setModal(null);
  };

  const handleDelete = () => {
    if (!modal) return;
    setRuns((prev) => prev.filter((_, i) => i !== modal.index));
    toast(`${modal.record.runId} deleted`, "trash-2");
    setModal(null);
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Payroll Runs</h2>
          <p className="section-sub">Manage and track payroll processing</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal("create")}>
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
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => openModal("view", run, runs.indexOf(run))}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => openModal("edit", run, runs.indexOf(run))}><Icon name="edit" size={14} style={{ marginRight: 4 }} />Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <RecordModal
          mode={modal.mode}
          title={modal.mode === "create" ? "New Payroll Run" : modal.mode === "edit" ? "Edit Payroll Run" : "Payroll Run Details"}
          record={modal.record}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={modal.mode === "view" ? handleDelete : undefined}
        />
      )}
    </>
  );
}
