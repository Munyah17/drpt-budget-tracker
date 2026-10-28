"use client";

import { useState, useMemo, FormEvent } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";
import Modal from "@/components/Modal";
import {
  useCorpStore, updateCorp, payrollNext, payrollBadge,
  PayrollRunRec, PayrollStatus,
} from "@/lib/corpStore";
import { usd } from "@/lib/payslip";

const th = { padding: "12px 8px", fontWeight: 600, fontSize: 13 } as const;
const td = { padding: "12px 8px", fontSize: 13 } as const;

const ACTION_LABEL: Record<string, string> = {
  "Pending Review": "Submit for Review",
  Approved: "Approve",
  Paid: "Mark Paid",
};

function NewRunModal({ onClose }: { onClose: () => void }) {
  const { toast, user } = useAppData();
  const store = useCorpStore();
  const [period, setPeriod] = useState("");
  const [kind, setKind] = useState<"Regular" | "Off-cycle">("Regular");
  const [employees, setEmployees] = useState(String(store.employees.length || ""));
  const [total, setTotal] = useState("");
  const [payDate, setPayDate] = useState("");
  const [note, setNote] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const run: PayrollRunRec = {
      id: `RUN-${Date.now().toString(36).toUpperCase()}`,
      period: period || new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
      kind,
      employees: parseInt(employees) || store.employees.length || 0,
      totalAmount: parseFloat(total) || 0,
      status: "Draft",
      payDate: payDate || "—",
      createdBy: user?.name,
      note: kind === "Off-cycle" ? note || "Off-cycle payment" : note,
    };
    updateCorp((s) => ({ ...s, payrollRuns: [run, ...s.payrollRuns] }));
    toast(`${kind} payroll run ${run.id} created as Draft`, "check-circle");
    onClose();
  }

  return (
    <Modal title="New Payroll Run" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field">
          <label>Run type</label>
          <select className="settings-select" style={{ width: "100%" }} value={kind} onChange={(e) => setKind(e.target.value as "Regular" | "Off-cycle")}>
            <option>Regular</option>
            <option>Off-cycle</option>
          </select>
        </div>
        <div className="field">
          <label>Period {kind === "Off-cycle" ? "(e.g. Bonus — Oct 2026)" : ""}</label>
          <input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder={kind === "Regular" ? "November 2026" : "Bonus — Oct 2026"} />
        </div>
        <div className="field">
          <label>Employees</label>
          <input type="number" min="0" value={employees} onChange={(e) => setEmployees(e.target.value)} />
        </div>
        <div className="field">
          <label>Total amount ($)</label>
          <input required type="number" min="0" step="0.01" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="e.g. 48200" />
        </div>
        <div className="field">
          <label>Pay date</label>
          <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
        </div>
        {kind === "Off-cycle" && (
          <div className="field">
            <label>Reason</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Bonus / correction / termination" />
          </div>
        )}
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit">Create Draft Run</button>
      </form>
    </Modal>
  );
}

export default function CorporatePayrollRunsPage() {
  const { toast, user } = useAppData();
  const store = useCorpStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(
    () =>
      store.payrollRuns.filter(
        (r) =>
          (!statusFilter || r.status === statusFilter) &&
          (r.id.toLowerCase().includes(search.toLowerCase()) ||
            r.period.toLowerCase().includes(search.toLowerCase()))
      ),
    [store.payrollRuns, search, statusFilter]
  );

  const count = (s: PayrollStatus) => store.payrollRuns.filter((r) => r.status === s).length;
  const awaiting = count("Pending Review");

  function advance(run: PayrollRunRec) {
    const next = payrollNext(run.status);
    if (!next) return;
    updateCorp((s) => ({
      ...s,
      payrollRuns: s.payrollRuns.map((r) =>
        r.id === run.id
          ? { ...r, status: next, ...(next === "Approved" ? { approvedBy: user?.name } : {}) }
          : r
      ),
    }));
    toast(`${run.id} → ${next}`, next === "Paid" ? "check-circle" : "check");
  }

  function reject(run: PayrollRunRec) {
    updateCorp((s) => ({
      ...s,
      payrollRuns: s.payrollRuns.map((r) => (r.id === run.id ? { ...r, status: "Rejected" as const } : r)),
    }));
    toast(`${run.id} rejected`, "x");
  }

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Payroll Runs</h2>
          <p className="section-sub">Draft → Review → Approve → Pay. Off-cycle runs supported.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          New Payroll Run
        </button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad"><div className="stat-label">Draft</div><div className="stat-value">{count("Draft")}</div></div>
        <div className="glass-card card-pad">
          <div className="stat-label">Awaiting Approval</div>
          <div className="stat-value" style={{ color: awaiting ? "var(--amber)" : undefined }}>{awaiting}</div>
        </div>
        <div className="glass-card card-pad"><div className="stat-label">Approved (unpaid)</div><div className="stat-value">{count("Approved")}</div></div>
        <div className="glass-card card-pad"><div className="stat-label">Paid</div><div className="stat-value" style={{ color: "var(--green)" }}>{count("Paid")}</div></div>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder="Search runs..."
          statusOptions={[
            { value: "Draft", label: "Draft" },
            { value: "Pending Review", label: "Pending Review" },
            { value: "Approved", label: "Approved" },
            { value: "Paid", label: "Paid" },
            { value: "Rejected", label: "Rejected" },
          ]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={th}>Run ID</th>
              <th style={th}>Period</th>
              <th style={th}>Type</th>
              <th style={th}>Employees</th>
              <th style={th}>Total</th>
              <th style={th}>Status</th>
              <th style={th}>Pay Date</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>No payroll runs — create your first one.</td></tr>
            )}
            {filtered.map((run) => {
              const next = payrollNext(run.status);
              return (
                <tr key={run.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <td style={td}>{run.id}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{run.period}</td>
                  <td style={td}><span className="chip">{run.kind}</span></td>
                  <td style={td}>{run.employees}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{usd(run.totalAmount)}</td>
                  <td style={td}><span className={"badge " + payrollBadge(run.status)}>{run.status}</span></td>
                  <td style={td}>{run.payDate}</td>
                  <td style={td}>
                    {next && (
                      <button
                        className="btn btn-ghost"
                        style={{ padding: "4px 8px", fontSize: 12, color: next === "Paid" ? "var(--green)" : "var(--rose-600)" }}
                        onClick={() => advance(run)}
                      >
                        <Icon name="check" size={14} style={{ marginRight: 4 }} />{ACTION_LABEL[next]}
                      </button>
                    )}
                    {(run.status === "Draft" || run.status === "Pending Review") && (
                      <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: "var(--red)" }} onClick={() => reject(run)}>
                        <Icon name="x" size={14} style={{ marginRight: 4 }} />Reject
                      </button>
                    )}
                    {run.approvedBy && <span style={{ fontSize: 11, color: "var(--ink-500)", display: "block" }}>by {run.approvedBy}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {creating && <NewRunModal onClose={() => setCreating(false)} />}
    </>
  );
}
