"use client";

import { FormEvent, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/Icon";
import Modal from "@/components/Modal";
import { useAppData } from "@/lib/AppDataContext";
import { useCorpStore, updateCorp, nextId, SalaryAdvance, AdvanceStatus } from "@/lib/corpStore";
import { accruedWages, advanceFee, nextPayday, workdaysElapsed, workdaysInMonth } from "@/lib/ewa";
import { useWallet } from "@/lib/walletStore";
import { ukDate, sym } from "@/lib/format";
import { usd } from "@/lib/payslip";

const NETPAY_KEY = "drpt-emp-netpay";
const th = { padding: "12px 8px", fontWeight: 600, fontSize: 13 } as const;
const td = { padding: "12px 8px", fontSize: 13 } as const;

const badge = (s: AdvanceStatus) =>
  s === "Settled" ? "badge-green" : s === "Paid Out" ? "badge-blue" : s === "Rejected" ? "badge-red" : "badge-amber";

function RequestModal({
  max, feePct, payday, walletOpen, onSubmit, onClose,
}: {
  max: number; feePct: number; payday: Date; walletOpen: boolean;
  onSubmit: (amount: number, destination: "wallet" | "external") => void; onClose: () => void;
}) {
  const t = useTranslations("Pages.emp_borrowing");
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState<"wallet" | "external">(walletOpen ? "wallet" : "external");
  const amt = Math.min(max, parseFloat(amount) || 0);
  const fee = advanceFee(amt, feePct);
  const over = (parseFloat(amount) || 0) > max;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (amt <= 0 || over) return;
    onSubmit(Math.round(amt * 100) / 100, destination);
  }

  return (
    <Modal title={t("requestTitle")} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field">
          <label>{t("requestAmount", { sym: sym() })}</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input required type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ flex: 1 }} />
            <button type="button" className="btn btn-ghost" onClick={() => setAmount(String(Math.floor(max)))}>{t("maxBtn")}</button>
          </div>
        </div>
        {over && <p style={{ fontSize: 12.5, color: "var(--red)", margin: "-4px 0 10px" }}>{t("tooMuch", { max: usd(max) })}</p>}
        <div className="field">
          <label>{t("destLabel")}</label>
          <select className="settings-select" style={{ width: "100%" }} value={destination} onChange={(e) => setDestination(e.target.value as "wallet" | "external")}>
            {walletOpen && <option value="wallet">{t("destWallet")}</option>}
            <option value="external">{t("destExternal")}</option>
          </select>
        </div>
        {amt > 0 && !over && (
          <div className="glass-card" style={{ padding: 14, marginBottom: 12, border: "1px solid var(--card-border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, padding: "4px 0" }}>
              <span style={{ color: "var(--ink-500)" }}>{t("youGet")}</span>
              <b style={{ color: "var(--green)" }}>{usd(amt)}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, padding: "4px 0" }}>
              <span style={{ color: "var(--ink-500)" }}>{t("accessFee", { pct: feePct })}</span>
              <b>{usd(fee)}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, padding: "6px 0 2px", borderTop: "1px solid var(--card-border)" }}>
              <span style={{ color: "var(--ink-500)" }}>{t("deductedOn", { date: ukDate(payday.toISOString().slice(0, 10)) })}</span>
              <b style={{ color: "var(--rose-600)" }}>{usd(amt + fee)}</b>
            </div>
          </div>
        )}
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit" disabled={amt <= 0 || over}>
          {t("confirmAccess")}
        </button>
      </form>
    </Modal>
  );
}

export default function EmployeeBorrowingPage() {
  const { user, toast } = useAppData();
  const t = useTranslations("Pages.emp_borrowing");
  const store = useCorpStore();
  const wallet = useWallet();
  const [requestOpen, setRequestOpen] = useState(false);
  const [editingSalary, setEditingSalary] = useState(false);
  const [salaryInput, setSalaryInput] = useState("");

  // Monthly take-home: the corp directory record wins; otherwise the employee
  // sets it once and it lives on this device.
  const directoryMatch = store.employees.find(
    (e) => e.name === user?.name || e.email === user?.email
  );
  const storedNet = typeof window !== "undefined" ? Number(localStorage.getItem(NETPAY_KEY) || 0) : 0;
  const netPay = directoryMatch ? Math.round(directoryMatch.grossPay * 0.75 * 100) / 100 : storedNet;

  const now = new Date();
  const payday = nextPayday(now);
  const { ewa } = store;

  const myAdvances = useMemo(
    () => store.advances.filter((a) => a.employee === user?.name),
    [store.advances, user?.name]
  );
  const monthPrefix = now.toISOString().slice(0, 7);
  const thisMonthCount = myAdvances.filter(
    (a) => a.requestedAt.startsWith(monthPrefix) && a.status !== "Rejected"
  ).length;
  const liveAmount = myAdvances
    .filter((a) => a.status === "Pending" || a.status === "Approved" || a.status === "Paid Out")
    .reduce((s, a) => s + a.amount, 0);
  const outstandingRepay = myAdvances
    .filter((a) => a.status === "Approved" || a.status === "Paid Out")
    .reduce((s, a) => s + a.repay, 0);

  const earned = accruedWages(netPay, now);
  const cap = Math.floor((earned * ewa.maxAccruedPct) / 100 * 100) / 100;
  const available = Math.max(0, Math.round((cap - liveAmount) * 100) / 100);
  const limitReached = thisMonthCount >= ewa.maxPerMonth;

  const statusLabel = (s: AdvanceStatus) =>
    s === "Pending" ? t("statusPending")
    : s === "Approved" ? t("statusApproved")
    : s === "Paid Out" ? t("statusPaidOut")
    : s === "Settled" ? t("statusSettled")
    : t("statusRejected");

  function saveSalary(e: FormEvent) {
    e.preventDefault();
    const v = parseFloat(salaryInput) || 0;
    if (v <= 0) return;
    localStorage.setItem(NETPAY_KEY, String(v));
    setEditingSalary(false);
    setSalaryInput("");
  }

  function handleRequest(amount: number, destination: "wallet" | "external") {
    const fee = advanceFee(amount, ewa.feePct);
    const auto = amount <= ewa.autoApproveBelow;
    const adv: SalaryAdvance = {
      id: nextId("ADV"),
      employee: user?.name ?? "Employee",
      amount,
      fee,
      repay: Math.round((amount + fee) * 100) / 100,
      status: auto ? "Approved" : "Pending",
      destination,
      requestedAt: new Date().toISOString().slice(0, 10),
      ...(auto ? { decidedBy: "auto" } : {}),
    };
    updateCorp((s) => ({ ...s, advances: [adv, ...s.advances] }));
    toast(auto ? t("autoApprovedToast", { amount: usd(amount) }) : t("requestToast", { amount: usd(amount) }), "check-circle");
    setRequestOpen(false);
  }

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle", { org: user?.organisation ?? t("yourOrganisation") })}</p>
        </div>
      </div>

      {!ewa.enabled && (
        <div className="glass-card card-pad" style={{ marginBottom: 20, borderLeft: "3px solid var(--amber)" }}>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--ink-700)" }}>{t("disabledNote")}</p>
        </div>
      )}

      {!netPay && ewa.enabled && (
        <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
          <p style={{ margin: "0 0 10px", fontSize: 13.5, color: "var(--ink-700)" }}>{t("setSalaryCta")}</p>
          <form onSubmit={saveSalary} style={{ display: "flex", gap: 10, maxWidth: 380 }}>
            <input
              required type="number" min="1" step="0.01" value={salaryInput}
              onChange={(e) => setSalaryInput(e.target.value)}
              placeholder={t("monthlyNetLabel", { sym: sym() })}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" type="submit">{t("setSalarySave")}</button>
          </form>
        </div>
      )}

      {netPay > 0 && (
        <div className="glass-card card-pad" style={{ marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 18, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ minWidth: 180 }}>
            <div className="stat-label">{t("earnedSoFar")}</div>
            <div className="stat-value" style={{ fontSize: 34 }}>{usd(earned)}</div>
            <div style={{ fontSize: 12, color: "var(--ink-500)" }}>
              {t("earnedOf", { net: usd(netPay) })} · {workdaysElapsed(now)}/{workdaysInMonth(now.getFullYear(), now.getMonth())} {t("workdays")}
            </div>
          </div>
          <div style={{ minWidth: 180 }}>
            <div className="stat-label">{t("availableToAccess")}</div>
            <div className="stat-value" style={{ fontSize: 34, color: "var(--rose-600)" }}>{usd(available)}</div>
            <div style={{ fontSize: 12, color: "var(--ink-500)" }}>{t("payday", { date: ukDate(payday.toISOString().slice(0, 10)) })}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
            <button
              className="btn btn-primary"
              disabled={!ewa.enabled || available < 1 || limitReached}
              onClick={() => setRequestOpen(true)}
            >
              <Icon name="zap" size={16} style={{ marginRight: 8 }} />{t("accessNow")}
            </button>
            {limitReached && <span style={{ fontSize: 12, color: "var(--amber)" }}>{t("overMonthlyLimit", { count: ewa.maxPerMonth })}</span>}
            {outstandingRepay > 0 && <span style={{ fontSize: 12, color: "var(--ink-500)" }}>{t("outstandingRepay", { amount: usd(outstandingRepay) })}</span>}
            {!directoryMatch && (
              <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }} onClick={() => setEditingSalary((v) => !v)}>
                {t("salaryEdit")}
              </button>
            )}
            {editingSalary && (
              <form onSubmit={saveSalary} style={{ display: "flex", gap: 8 }}>
                <input required type="number" min="1" step="0.01" value={salaryInput} onChange={(e) => setSalaryInput(e.target.value)} placeholder={t("monthlyNetLabel", { sym: sym() })} style={{ width: 140 }} />
                <button className="btn btn-primary btn-sm" type="submit">{t("setSalarySave")}</button>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <Icon name="info" size={16} style={{ color: "var(--rose-600)" }} />
          <h3 style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>{t("howItWorks")}</h3>
        </div>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13.5, color: "var(--ink-700)", display: "flex", flexDirection: "column", gap: 6 }}>
          <li>{t("how1", { pct: ewa.maxAccruedPct })}</li>
          <li>{t("how2", { fee: ewa.feePct })}</li>
          <li>{t("how3")}</li>
        </ul>
      </div>

      <div className="glass-card card-pad">
        <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 14 }}>{t("historyTitle")}</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={th}>{t("thId")}</th>
              <th style={th}>{t("thReceived")}</th>
              <th style={th}>{t("thFee")}</th>
              <th style={th}>{t("thRepay")}</th>
              <th style={th}>{t("thStatus")}</th>
              <th style={th}>{t("thRequested")}</th>
            </tr>
          </thead>
          <tbody>
            {myAdvances.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>{t("emptyHistory")}</td></tr>
            )}
            {myAdvances.map((a) => (
              <tr key={a.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={td}>{a.id}</td>
                <td style={{ ...td, fontWeight: 600 }}>{usd(a.amount)}</td>
                <td style={td}>{usd(a.fee)}</td>
                <td style={{ ...td, fontWeight: 600, color: "var(--rose-600)" }}>{usd(a.repay)}</td>
                <td style={td}><span className={`badge ${badge(a.status)}`}>{statusLabel(a.status)}</span></td>
                <td style={td}>{ukDate(a.requestedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {requestOpen && (
        <RequestModal
          max={available}
          feePct={ewa.feePct}
          payday={payday}
          walletOpen={wallet.opened}
          onSubmit={handleRequest}
          onClose={() => setRequestOpen(false)}
        />
      )}
    </>
  );
}
