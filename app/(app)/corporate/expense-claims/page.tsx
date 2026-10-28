"use client";

import { useState, useMemo, FormEvent } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";
import Modal from "@/components/Modal";
import { useCorpStore, updateCorp, nextId, ExpenseClaim, ClaimStatus } from "@/lib/corpStore";
import { usd } from "@/lib/payslip";

const th = { padding: "12px 8px", fontWeight: 600, fontSize: 13 } as const;
const td = { padding: "12px 8px", fontSize: 13 } as const;
const badge = (s: ClaimStatus) =>
  s === "Approved" || s === "Reimbursed" ? "badge-green" : s === "Rejected" ? "badge-red" : "badge-amber";

const CATEGORIES = ["Travel", "Meals", "Supplies", "Fuel", "Airtime/Data", "Medical", "Other"];

function ClaimModal({ onClose }: { onClose: () => void }) {
  const { toast } = useAppData();
  const [employee, setEmployee] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const claim: ExpenseClaim = {
      id: nextId("CLM"), employee, category, amount: parseFloat(amount) || 0,
      date, note, status: "Pending",
    };
    updateCorp((s) => ({ ...s, claims: [claim, ...s.claims] }));
    toast("Expense claim submitted for review", "check-circle");
    onClose();
  }

  return (
    <Modal title="New Expense Claim" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field"><label>Employee</label><input required value={employee} onChange={(e) => setEmployee(e.target.value)} placeholder="Full name" /></div>
        <div className="field">
          <label>Category</label>
          <select className="settings-select" style={{ width: "100%" }} value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="field"><label>Amount ($)</label><input required type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        <div className="field"><label>Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div className="field"><label>Note / receipt ref</label><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" /></div>
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit">Submit Claim</button>
      </form>
    </Modal>
  );
}

export default function ExpenseClaimsPage() {
  const { toast } = useAppData();
  const store = useCorpStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(
    () => store.claims.filter((c) =>
      (!statusFilter || c.status === statusFilter) &&
      (c.employee.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase()))),
    [store.claims, search, statusFilter]
  );

  const pending = store.claims.filter((c) => c.status === "Pending");
  const pendingTotal = pending.reduce((s, c) => s + c.amount, 0);

  function decide(c: ExpenseClaim, status: ClaimStatus) {
    updateCorp((s) => ({ ...s, claims: s.claims.map((x) => (x.id === c.id ? { ...x, status } : x)) }));
    toast(`Claim ${c.id} ${status.toLowerCase()}`, status === "Rejected" ? "x" : "check-circle");
  }

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Expense Claims</h2>
          <p className="section-sub">Approve reimbursements — paid out in the next payroll run</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />New Claim
        </button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad"><div className="stat-label">Pending</div><div className="stat-value" style={{ color: pending.length ? "var(--amber)" : undefined }}>{pending.length}</div></div>
        <div className="glass-card card-pad"><div className="stat-label">Pending Value</div><div className="stat-value">{usd(pendingTotal)}</div></div>
        <div className="glass-card card-pad"><div className="stat-label">Approved</div><div className="stat-value">{store.claims.filter((c) => c.status === "Approved").length}</div></div>
        <div className="glass-card card-pad"><div className="stat-label">Reimbursed</div><div className="stat-value" style={{ color: "var(--green)" }}>{store.claims.filter((c) => c.status === "Reimbursed").length}</div></div>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder="Search claims..."
          statusOptions={["Pending", "Approved", "Rejected", "Reimbursed"].map((v) => ({ value: v, label: v }))}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={th}>Claim</th><th style={th}>Employee</th><th style={th}>Category</th>
              <th style={th}>Amount</th><th style={th}>Date</th><th style={th}>Status</th><th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>No claims match.</td></tr>
            )}
            {filtered.map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={td}>{c.id}{c.note && <div style={{ fontSize: 11, color: "var(--ink-500)" }}>{c.note}</div>}</td>
                <td style={{ ...td, fontWeight: 600 }}>{c.employee}</td>
                <td style={td}><span className="chip">{c.category}</span></td>
                <td style={{ ...td, fontWeight: 600 }}>{usd(c.amount)}</td>
                <td style={td}>{c.date}</td>
                <td style={td}><span className={"badge " + badge(c.status)}>{c.status}</span></td>
                <td style={td}>
                  {c.status === "Pending" && (
                    <>
                      <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: "var(--green)" }} onClick={() => decide(c, "Approved")}><Icon name="check" size={13} style={{ marginRight: 4 }} />Approve</button>
                      <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: "var(--red)" }} onClick={() => decide(c, "Rejected")}><Icon name="x" size={13} style={{ marginRight: 4 }} />Reject</button>
                    </>
                  )}
                  {c.status === "Approved" && (
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => decide(c, "Reimbursed")}><Icon name="check" size={13} style={{ marginRight: 4 }} />Mark Reimbursed</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {creating && <ClaimModal onClose={() => setCreating(false)} />}
    </>
  );
}
