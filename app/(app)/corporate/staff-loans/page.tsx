"use client";

import { useState, useMemo, FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";
import Modal from "@/components/Modal";
import {
  useCorpStore, updateCorp, nextId,
  StaffLoan, ClaimStatus, SalaryAdvance, AdvanceStatus,
} from "@/lib/corpStore";
import { usd } from "@/lib/payslip";
import { ukDate } from "@/lib/format";
import { walletCredit } from "@/lib/walletStore";

const th = { padding: "12px 8px", fontWeight: 600, fontSize: 13 } as const;
const td = { padding: "12px 8px", fontSize: 13 } as const;
const badge = (s: ClaimStatus) =>
  s === "Approved" ? "badge-blue" : s === "Reimbursed" ? "badge-green" : s === "Rejected" ? "badge-red" : "badge-amber";
const advBadge = (s: AdvanceStatus) =>
  s === "Settled" ? "badge-green" : s === "Paid Out" ? "badge-blue" : s === "Rejected" ? "badge-red" : "badge-amber";

function LoanModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("Pages.corp_staff_loans");
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
    toast(t("toastSubmitted"), "check-circle");
    onClose();
  }

  return (
    <Modal title={t("modalTitle")} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field"><label>{t("thEmployee")}</label><input required value={employee} onChange={(e) => setEmployee(e.target.value)} placeholder={t("fullNamePlaceholder")} /></div>
        <div className="field"><label>{t("fieldAmount")}</label><input required type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        <div className="field"><label>{t("fieldMonths")}</label><input required type="number" min="1" max="24" value={months} onChange={(e) => setMonths(e.target.value)} /></div>
        {monthly > 0 && (
          <p style={{ fontSize: 13, color: "var(--ink-500)", margin: "-4px 0 10px" }}>
            {t.rich("deductionNote", {
              amount: usd(monthly),
              months: months || "1",
              b: (chunks) => <b style={{ color: "var(--rose-600)" }}>{chunks}</b>,
            })}
          </p>
        )}
        <div className="field"><label>{t("fieldReason")}</label><input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("optionalPlaceholder")} /></div>
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit">{t("submitApplication")}</button>
      </form>
    </Modal>
  );
}

/** Employer-side Early Pay queue + policy config. */
function EarlyPayTab() {
  const t = useTranslations("Pages.corp_staff_loans");
  const { toast, user } = useAppData();
  const store = useCorpStore();
  const { ewa } = store;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = useMemo(
    () => store.advances.filter((a) =>
      (!statusFilter || a.status === statusFilter) &&
      (a.employee.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase()))),
    [store.advances, search, statusFilter]
  );

  const pending = store.advances.filter((a) => a.status === "Pending").length;
  const outstanding = store.advances
    .filter((a) => a.status === "Approved" || a.status === "Paid Out")
    .reduce((s, a) => s + a.repay, 0);
  const monthPrefix = new Date().toISOString().slice(0, 7);
  const feesThisMonth = store.advances
    .filter((a) => a.requestedAt.startsWith(monthPrefix) && a.status !== "Rejected")
    .reduce((s, a) => s + a.fee, 0);

  const advStatusLabel = (s: AdvanceStatus) =>
    s === "Pending" ? t("advStatusPending")
    : s === "Approved" ? t("advStatusApproved")
    : s === "Paid Out" ? t("advStatusPaidOut")
    : s === "Settled" ? t("advStatusSettled")
    : t("advStatusRejected");

  function setEwa(patch: Partial<typeof ewa>) {
    updateCorp((s) => ({ ...s, ewa: { ...s.ewa, ...patch } }));
  }

  function decide(a: SalaryAdvance, status: "Approved" | "Rejected") {
    updateCorp((s) => ({
      ...s,
      advances: s.advances.map((x) => (x.id === a.id ? { ...x, status, decidedBy: user?.name } : x)),
    }));
    toast(t(status === "Approved" ? "advToastApproved" : "advToastRejected", { id: a.id }), status === "Approved" ? "check-circle" : "x");
  }

  function payOut(a: SalaryAdvance) {
    updateCorp((s) => ({
      ...s,
      advances: s.advances.map((x) =>
        x.id === a.id ? { ...x, status: "Paid Out" as const, paidOutAt: new Date().toISOString().slice(0, 10) } : x
      ),
    }));
    // Wallet destination lands instantly in the employee's WellSpend wallet
    if (a.destination === "wallet") {
      walletCredit(a.amount, `Early Pay — ${a.id}`, "EWA", user?.organisation ?? undefined);
    }
    toast(t("advToastPaidOut", { amount: usd(a.amount), employee: a.employee }), "check-circle");
  }

  return (
    <>
      <div className="grid grid-3" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad"><div className="stat-label">{t("advStatPending")}</div><div className="stat-value" style={{ color: pending ? "var(--amber)" : undefined }}>{pending}</div></div>
        <div className="glass-card card-pad"><div className="stat-label">{t("advStatOutstanding")}</div><div className="stat-value">{usd(outstanding)}</div></div>
        <div className="glass-card card-pad"><div className="stat-label">{t("advStatFees")}</div><div className="stat-value" style={{ color: "var(--green)" }}>{usd(feesThisMonth)}</div></div>
      </div>

      <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h3 style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>{t("cfgTitle")}</h3>
          <label className="switch">
            <input type="checkbox" checked={ewa.enabled} onChange={(e) => setEwa({ enabled: e.target.checked })} />
            <span className="track"><span className="knob" /></span>
          </label>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>{t("cfgFee")}</label>
            <input type="number" min="0" max="30" step="0.5" value={ewa.feePct} onChange={(e) => setEwa({ feePct: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>{t("cfgMaxPct")}</label>
            <input type="number" min="10" max="100" step="5" value={ewa.maxAccruedPct} onChange={(e) => setEwa({ maxAccruedPct: parseFloat(e.target.value) || 50 })} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>{t("cfgAuto")}</label>
            <input type="number" min="0" step="1" value={ewa.autoApproveBelow} onChange={(e) => setEwa({ autoApproveBelow: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>{t("cfgMaxMonth")}</label>
            <input type="number" min="1" max="10" value={ewa.maxPerMonth} onChange={(e) => setEwa({ maxPerMonth: parseInt(e.target.value) || 1 })} />
          </div>
        </div>
        <p style={{ fontSize: 12, color: "var(--ink-500)", margin: "10px 0 0" }}>{t("cfgHint")}</p>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder={t("advSearchPh")}
          statusOptions={(["Pending", "Approved", "Paid Out", "Settled", "Rejected"] as AdvanceStatus[]).map((v) => ({ value: v, label: advStatusLabel(v) }))}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={th}>{t("advThRef")}</th><th style={th}>{t("thEmployee")}</th><th style={th}>{t("advThAmount")}</th>
              <th style={th}>{t("advThFee")}</th><th style={th}>{t("advThRepay")}</th><th style={th}>{t("advThRequested")}</th>
              <th style={th}>{t("thStatus")}</th><th style={th}>{t("thActions")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>{t("advEmpty")}</td></tr>
            )}
            {filtered.map((a) => (
              <tr key={a.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={td}>{a.id}</td>
                <td style={{ ...td, fontWeight: 600 }}>{a.employee}</td>
                <td style={{ ...td, fontWeight: 600 }}>{usd(a.amount)}</td>
                <td style={td}>{usd(a.fee)}</td>
                <td style={{ ...td, fontWeight: 600, color: "var(--rose-600)" }}>{usd(a.repay)}</td>
                <td style={td}>{ukDate(a.requestedAt)}</td>
                <td style={td}>
                  <span className={"badge " + advBadge(a.status)}>{advStatusLabel(a.status)}</span>
                  {a.decidedBy && a.decidedBy !== "auto" && <div style={{ fontSize: 11, color: "var(--ink-500)" }}>{t("advBy", { name: a.decidedBy })}</div>}
                </td>
                <td style={td}>
                  {a.status === "Pending" && (
                    <>
                      <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: "var(--green)" }} onClick={() => decide(a, "Approved")}><Icon name="check" size={13} style={{ marginRight: 4 }} />{t("approve")}</button>
                      <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: "var(--red)" }} onClick={() => decide(a, "Rejected")}><Icon name="x" size={13} style={{ marginRight: 4 }} />{t("reject")}</button>
                    </>
                  )}
                  {a.status === "Approved" && (
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: "var(--rose-600)" }} onClick={() => payOut(a)}><Icon name="banknote" size={13} style={{ marginRight: 4 }} />{t("advPayOut")}</button>
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

export default function StaffLoansPage() {
  const t = useTranslations("Pages.corp_staff_loans");
  const { toast } = useAppData();
  const store = useCorpStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState<"early" | "loans">("early");

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
    const toastKey = status === "Rejected" ? "decideRejected" : status === "Approved" ? "decideApproved" : "decideReimbursed";
    toast(t(toastKey, { id: l.id }), status === "Rejected" ? "x" : "check-circle");
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
    toast(t("toastDeducted", { amount: usd(l.monthlyDeduction), employee: l.employee }), "check");
  }

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        {tab === "loans" && (
          <button className="btn btn-primary" onClick={() => setCreating(true)}>
            <Icon name="plus" size={16} style={{ marginRight: 8 }} />{t("newLoan")}
          </button>
        )}
      </div>

      <div className="tabs" style={{ marginBottom: 18 }}>
        <button className={"tab-btn" + (tab === "early" ? " active" : "")} onClick={() => setTab("early")}>
          {t("tabEarly")}
        </button>
        <button className={"tab-btn" + (tab === "loans" ? " active" : "")} onClick={() => setTab("loans")}>
          {t("tabLoans")}
        </button>
      </div>

      {tab === "early" && <EarlyPayTab />}

      {tab === "loans" && (<>
      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad"><div className="stat-label">{t("statPending")}</div><div className="stat-value" style={{ color: pendingCount ? "var(--amber)" : undefined }}>{pendingCount}</div></div>
        <div className="glass-card card-pad"><div className="stat-label">{t("statActive")}</div><div className="stat-value">{active.length}</div></div>
        <div className="glass-card card-pad"><div className="stat-label">{t("statOutstanding")}</div><div className="stat-value">{usd(activeOut)}</div></div>
        <div className="glass-card card-pad"><div className="stat-label">{t("statRepaid")}</div><div className="stat-value" style={{ color: "var(--green)" }}>{store.loans.filter((l) => l.status === "Reimbursed").length}</div></div>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder={t("searchPlaceholder")}
          statusOptions={["Pending", "Approved", "Rejected", "Reimbursed"].map((v) => ({ value: v, label: v === "Reimbursed" ? t("statusFullyRepaid") : t(`status.${v.toLowerCase()}`) }))}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={th}>{t("thLoan")}</th><th style={th}>{t("thEmployee")}</th><th style={th}>{t("thAmount")}</th>
              <th style={th}>{t("thMonthly")}</th><th style={th}>{t("thProgress")}</th><th style={th}>{t("thStatus")}</th><th style={th}>{t("thActions")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>{t("emptyState")}</td></tr>
            )}
            {filtered.map((l) => (
              <tr key={l.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={td}>{l.id}{l.reason && <div style={{ fontSize: 11, color: "var(--ink-500)" }}>{l.reason}</div>}</td>
                <td style={{ ...td, fontWeight: 600 }}>{l.employee}</td>
                <td style={{ ...td, fontWeight: 600 }}>{usd(l.amount)}</td>
                <td style={td}>{usd(l.monthlyDeduction)}</td>
                <td style={td}>{t("progress", { paid: l.monthsPaid, months: l.months })}</td>
                <td style={td}><span className={"badge " + badge(l.status)}>{l.status === "Reimbursed" ? t("badgeRepaid") : t(`status.${l.status.toLowerCase()}`)}</span></td>
                <td style={td}>
                  {l.status === "Pending" && (
                    <>
                      <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: "var(--green)" }} onClick={() => decide(l, "Approved")}><Icon name="check" size={13} style={{ marginRight: 4 }} />{t("approve")}</button>
                      <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: "var(--red)" }} onClick={() => decide(l, "Rejected")}><Icon name="x" size={13} style={{ marginRight: 4 }} />{t("reject")}</button>
                    </>
                  )}
                  {l.status === "Approved" && l.monthsPaid < l.months && (
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => deduct(l)}><Icon name="banknote" size={13} style={{ marginRight: 4 }} />{t("applyDeduction")}</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>)}
      {creating && <LoanModal onClose={() => setCreating(false)} />}
    </>
  );
}
