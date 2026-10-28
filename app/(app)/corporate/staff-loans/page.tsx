"use client";

import { useState, useMemo, FormEvent } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";
import Modal from "@/components/Modal";
import { useCorpStore, updateCorp, nextId, StaffLoan, ClaimStatus } from "@/lib/corpStore";
import { usd } from "@/lib/payslip";

const th = { padding: "12px 8px", fontWeight: 600, fontSize: 13 } as const;
const td = { padding: "12px 8px", fontSize: 13 } as const;
const badge = (s: ClaimStatus) =>
  s === "Approved" ? "badge-blue" : s === "Reimbursed" ? "badge-green" : s === "Rejected" ? "badge-red" : "badge-amber";

function LoanModal({ onClose }: { onClose: () => void }) {
  const { toast } = useAppData();
  const [employee, setEmployee] = useState("");
  const [amount, setAmount] = useState("");
  const [months, setMonths] = useState("6");
  const [reason, setReason] = useState("");

  const monthly = (parseFloat(amount) || 0) / Math.max(1, parseInt(months) || 1);

  function submit(e: FormEvent) {
    e.preventDefault();
    const loan: StaffLoan = {
      id: nextId("LOAN"), employee, amount: parseFloat(amount) || 0,
      months: parseInt(months) || 1, monthlyDeduction: Math.round(monthly * 100) / 100,
      monthsPaid: 0, reason, status: "Pending",
    };
    updateCorp((s) => ({ ...s, loans: [loan, ...s.loans] }));
    toast("Loan application submitted for approval", "check-circle");
    onClose();
  }

  return (
    <Modal title="New Salary Advance / Loan" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field"><label>Employee</label><input required value={employee} onChange={(e) => setEmployee(e.target.value)} placeholder="Full name" /></div>
        <div className="field"><label>Amount ($)</label><input required type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        <div className="field"><label>Repay over (months)</label><input required type="number" min="1" max="24" value={months} onChange={(e) => setMonths(e.target.value)} /></div>
        {monthly > 0 && (
          <p style={{ fontSize: 13, color: "var(--ink-500)", margin: "-4px 0 10px" }}>
            Payroll deduction: <b style={{ color: "var(--rose-600)" }}>{usd(monthly)}/month</b> for {months || 1} months
          </p>
        )}
        <div className="field"><label>Reason</label><input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional" /></div>
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit">Submit Application</button>
      </form>
    </Modal>
  );
}

export default function StaffLoansPage() {
  const { toast } = useAppData();
  const store = useCorpStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(
    () => store.loans.filter((l) =>
      (!statusFilter || l.status === statusFilter) &&
      (l.employee.toLowerCase().includes(search.toLowerCase()) || l.id.toLowerCase().includes(search.toLowerCase()))),
    [store.loans, search, statusFilter]
  );

  const active = store.loans.filter((l) => l.status === "Approved");
  const activeOut = active.reduce((s, l) => s + l.amount - l.monthlyDeduction * l.monthsPaid, 0);
  const pendingCount = store.loans.filter((l) => l.status === "Pending").length;

  function decide(l: StaffLoan, status: ClaimStatus) {
    updateCorp((s) => ({ ...s, loans: s.loans.map((x) => (x.id === l.id ? { ...x, status } : x)) }));
    toast(`Loan ${l.id} ${status.toLowerCase()}`, status === "Rejected" ? "x" : "check-circle");
  }

  function deduct(l: StaffLoan) {
    updateCorp((s) => ({
      ...s,
      loans: s.loans.map((x) =>
        x.id === l.id
          ? { ...x, monthsPaid: x.monthsPaid + 1, status: x.monthsPaid + 1 >= x.months ? "Reimbursed" as const : x.status }
          : x
      ),
    }));
    toast(`Deduction ${usd(l.monthlyDeduction)} applied to ${l.employee}`, "check");
  }

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Staff Loans & Advances</h2>
          <p className="section-sub">Approve advances — deductions auto-apply to payslips</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />New Loan
        </button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad"><div className="stat-label">Pending</div><div className="stat-value" style={{ color: pendingCount ? "var(--amber)" : undefined }}>{pendingCount}</div></div>
        <div className="glass-card card-pad"><div className="stat-label">Active Loans</div><div className="stat-value">{active.length}</div></div>
        <div className="glass-card card-pad"><div className="stat-label">Outstanding</div><div className="stat-value">{usd(activeOut)}</div></div>
        <div className="glass-card card-pad"><div className="stat-label">Fully Repaid</div><div className="stat-value" style={{ color: "var(--green)" }}>{store.loans.filter((l) => l.status === "Reimbursed").length}</div></div>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder="Search loans..."
          statusOptions={["Pending", "Approved", "Rejected", "Reimbursed"].map((v) => ({ value: v, label: v === "Reimbursed" ? "Fully repaid" : v }))}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={th}>Loan</th><th style={th}>Employee</th><th style={th}>Amount</th>
              <th style={th}>Monthly</th><th style={th}>Progress</th><th style={th}>Status</th><th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>No loans match.</td></tr>
            )}
            {filtered.map((l) => (
              <tr key={l.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={td}>{l.id}{l.reason && <div style={{ fontSize: 11, color: "var(--ink-500)" }}>{l.reason}</div>}</td>
                <td style={{ ...td, fontWeight: 600 }}>{l.employee}</td>
                <td style={{ ...td, fontWeight: 600 }}>{usd(l.amount)}</td>
                <td style={td}>{usd(l.monthlyDeduction)}</td>
                <td style={td}>{l.monthsPaid}/{l.months} mo</td>
                <td style={td}><span className={"badge " + badge(l.status)}>{l.status === "Reimbursed" ? "Repaid" : l.status}</span></td>
                <td style={td}>
                  {l.status === "Pending" && (
                    <>
                      <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: "var(--green)" }} onClick={() => decide(l, "Approved")}><Icon name="check" size={13} style={{ marginRight: 4 }} />Approve</button>
                      <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: "var(--red)" }} onClick={() => decide(l, "Rejected")}><Icon name="x" size={13} style={{ marginRight: 4 }} />Reject</button>
                    </>
                  )}
                  {l.status === "Approved" && l.monthsPaid < l.months && (
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => deduct(l)}><Icon name="banknote" size={13} style={{ marginRight: 4 }} />Apply Deduction</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {creating && <LoanModal onClose={() => setCreating(false)} />}
    </>
  );
}
