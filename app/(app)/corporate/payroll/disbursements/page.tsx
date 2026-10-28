"use client";

import { useState, useMemo, FormEvent } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import Modal from "@/components/Modal";
import { downloadCsv } from "@/lib/download";
import { useCorpStore, updateCorp, payrollBadge, PayrollRunRec } from "@/lib/corpStore";
import { usd } from "@/lib/payslip";

const th = { padding: "12px 8px", fontWeight: 600, fontSize: 13 } as const;
const td = { padding: "12px 8px", fontSize: 13 } as const;

/** Per-employee bank detail editor — used when employees lack bank info. */
function BankModal({ onClose }: { onClose: () => void }) {
  const { toast } = useAppData();
  const store = useCorpStore();
  const [rows, setRows] = useState(
    store.employees.map((e) => ({ id: e.id, name: e.name, bankName: e.bankName, bankAccount: e.bankAccount }))
  );

  function save(e: FormEvent) {
    e.preventDefault();
    const map = new Map(rows.map((r) => [r.id, r]));
    updateCorp((s) => ({
      ...s,
      employees: s.employees.map((emp) => {
        const r = map.get(emp.id);
        return r ? { ...emp, bankName: r.bankName, bankAccount: r.bankAccount } : emp;
      }),
    }));
    toast("Bank details saved", "check-circle");
    onClose();
  }

  return (
    <Modal title="Employee Bank Details" onClose={onClose}>
      <form onSubmit={save}>
        {rows.length === 0 && <p style={{ color: "var(--ink-500)", fontSize: 13 }}>No employees yet — import them first.</p>}
        {rows.map((r, i) => (
          <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr", gap: 8, marginBottom: 8, alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</span>
            <input placeholder="Bank" value={r.bankName} onChange={(e) => setRows((p) => p.map((x, j) => (j === i ? { ...x, bankName: e.target.value } : x)))} />
            <input placeholder="Account no." value={r.bankAccount} onChange={(e) => setRows((p) => p.map((x, j) => (j === i ? { ...x, bankAccount: e.target.value } : x)))} />
          </div>
        ))}
        {rows.length > 0 && <button className="btn btn-primary" style={{ width: "100%", marginTop: 8 }} type="submit">Save</button>}
      </form>
    </Modal>
  );
}

export default function DisbursementsPage() {
  const { toast } = useAppData();
  const store = useCorpStore();
  const [banks, setBanks] = useState(false);

  const approved = useMemo(
    () => store.payrollRuns.filter((r) => r.status === "Approved" || r.status === "Paid"),
    [store.payrollRuns]
  );

  function exportRun(run: PayrollRunRec) {
    const rows = store.employees.map((e) => ({
      run_id: run.id,
      employee: e.name,
      bank: e.bankName,
      account: e.bankAccount,
      net_pay: run.employees > 0 ? (run.totalAmount / run.employees).toFixed(2) : run.totalAmount.toFixed(2),
      currency: "USD",
      reference: `${run.id}/${e.id}`,
    }));
    if (!rows.length) {
      downloadCsv(`disbursement-${run.id}.csv`, [
        { run_id: run.id, employee: "ALL STAFF", bank: "", account: "", net_pay: run.totalAmount.toFixed(2), currency: "USD", reference: run.id },
      ]);
    } else {
      downloadCsv(`disbursement-${run.id}.csv`, rows);
    }
    toast(`Bank file for ${run.id} downloaded — upload to your bank`, "download");
  }

  function exportEcocash(run: PayrollRunRec) {
    const rows = store.employees.map((e) => ({
      run_id: run.id,
      employee: e.name,
      phone: "",
      amount: run.employees > 0 ? (run.totalAmount / run.employees).toFixed(2) : run.totalAmount.toFixed(2),
      currency: "USD",
    }));
    downloadCsv(`ecocash-bulk-${run.id}.csv`, rows.length ? rows : [
      { run_id: run.id, employee: "ALL STAFF", phone: "", amount: run.totalAmount.toFixed(2), currency: "USD" },
    ]);
    toast(`Ecocash bulk file for ${run.id} downloaded`, "download");
  }

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Disbursements</h2>
          <p className="section-sub">Export bank / Ecocash bulk payment files for approved runs</p>
        </div>
        <button className="btn btn-ghost" onClick={() => setBanks(true)}>
          <Icon name="wallet" size={15} style={{ marginRight: 6 }} />Bank Details
        </button>
      </div>

      <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
        <div className="card-head"><h3>Ready to disburse</h3></div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={th}>Run</th><th style={th}>Period</th><th style={th}>Employees</th>
              <th style={th}>Total</th><th style={th}>Status</th><th style={th}>Export</th>
            </tr>
          </thead>
          <tbody>
            {approved.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                No approved runs yet — approve a payroll run first.
              </td></tr>
            )}
            {approved.map((run) => (
              <tr key={run.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={td}>{run.id}</td>
                <td style={{ ...td, fontWeight: 600 }}>{run.period}</td>
                <td style={td}>{run.employees}</td>
                <td style={{ ...td, fontWeight: 600 }}>{usd(run.totalAmount)}</td>
                <td style={td}><span className={"badge " + payrollBadge(run.status)}>{run.status}</span></td>
                <td style={td}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => exportRun(run)}>
                    <Icon name="download" size={13} style={{ marginRight: 4 }} />Bank CSV
                  </button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => exportEcocash(run)}>
                    <Icon name="download" size={13} style={{ marginRight: 4 }} />Ecocash
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="glass-card card-pad" style={{ fontSize: 13, color: "var(--ink-500)", lineHeight: 1.7 }}>
        <Icon name="file-text" size={15} style={{ marginRight: 6, verticalAlign: -2 }} />
        Upload the CSV to your bank&apos;s bulk-payment portal or Ecocash for Business. Each row splits the run total
        evenly across employees — set per-employee net pay in a future payslip import. Only <b>Approved</b> runs appear here.
      </div>

      {banks && <BankModal onClose={() => setBanks(false)} />}
    </>
  );
}
