"use client";

import { useMemo, useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { sym, fmt } from "@/lib/format";
import CountUp from "@/components/CountUp";
import Icon from "@/components/Icon";
import LineChart from "@/components/charts/LineChart";

interface Debt {
  id: number;
  name: string;
  amount: number;
}

const DEBTS_KEY = "drpt-debts";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function NetWorthPage() {
  const { accounts, goals, income, expenses, totalBalance, toast } = useAppData();
  const [debts, setDebts] = useState<Debt[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(DEBTS_KEY);
      return raw ? (JSON.parse(raw) as Debt[]) : [];
    } catch {
      return [];
    }
  });
  const [debtName, setDebtName] = useState("");
  const [debtAmount, setDebtAmount] = useState("");

  function saveDebts(next: Debt[]) {
    setDebts(next);
    localStorage.setItem(DEBTS_KEY, JSON.stringify(next));
  }

  function addDebt() {
    const amount = parseFloat(debtAmount);
    if (!debtName.trim() || !amount || amount <= 0) return;
    saveDebts([...debts, { id: Date.now(), name: debtName.trim(), amount }]);
    setDebtName("");
    setDebtAmount("");
    toast("Liability added", "plus");
  }

  const totalAssets = useMemo(
    () => totalBalance + goals.reduce((s, g) => s + g.saved, 0),
    [totalBalance, goals]
  );
  const totalDebts = debts.reduce((s, d) => s + d.amount, 0);
  const netWorth = totalAssets - totalDebts;

  // Trend: cumulative (income − expenses) per month ending at current net worth
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTHS[d.getMonth()] };
  });
  const monthOf = (d: string) => {
    const t = new Date(d);
    return `${t.getFullYear()}-${t.getMonth()}`;
  };
  const netByMonth = months.map((m) => {
    const inc = income.filter((i) => monthOf(i.date) === m.key).reduce((s, i) => s + i.amount, 0);
    const exp = expenses.filter((e) => monthOf(e.date) === m.key).reduce((s, e) => s + e.amount, 0);
    return inc - exp;
  });
  const cumulative: number[] = [];
  const prior = netWorth - netByMonth.reduce((a, b) => a + b, 0);
  netByMonth.reduce((acc, v, i) => {
    cumulative[i] = acc + v;
    return cumulative[i];
  }, prior);
  const hasData = income.length > 0 || expenses.length > 0;

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Net Worth</h2>
          <p className="section-sub">Everything you own, minus everything you owe</p>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">Net Worth</span>
            <div className="stat-icon" style={{ background: "var(--pink-100)", color: "var(--rose-600)" }}>
              <Icon name="target" size={17} />
            </div>
          </div>
          <div className="stat-value" style={{ color: netWorth < 0 ? "var(--red)" : undefined }}>
            <CountUp end={netWorth} prefix={sym()} />
          </div>
          <span className="stat-delta" style={{ color: "var(--ink-500)" }}>assets − liabilities</span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">Total Assets</span>
            <div className="stat-icon" style={{ background: "var(--pink-100)", color: "var(--green)" }}>
              <Icon name="wallet" size={17} />
            </div>
          </div>
          <div className="stat-value"><CountUp end={totalAssets} prefix={sym()} /></div>
          <span className="stat-delta" style={{ color: "var(--ink-500)" }}>accounts + savings</span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">Total Liabilities</span>
            <div className="stat-icon" style={{ background: "var(--pink-100)", color: "var(--red)" }}>
              <Icon name="credit-card" size={17} />
            </div>
          </div>
          <div className="stat-value"><CountUp end={totalDebts} prefix={sym()} /></div>
          <span className="stat-delta" style={{ color: "var(--ink-500)" }}>debts &amp; loans</span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">Saved in Goals</span>
            <div className="stat-icon" style={{ background: "var(--pink-100)", color: "var(--rose-600)" }}>
              <Icon name="piggy-bank" size={17} />
            </div>
          </div>
          <div className="stat-value">
            <CountUp end={goals.reduce((s, g) => s + g.saved, 0)} prefix={sym()} />
          </div>
          <span className="stat-delta" style={{ color: "var(--ink-500)" }}>{goals.length} active goals</span>
        </div>
      </div>

      <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
        <div className="card-head"><h3>Net Worth Trend</h3></div>
        {hasData ? (
          <LineChart
            labels={months.map((m) => m.label)}
            series={[{ name: "Net worth", color: "#c81057", data: cumulative }]}
          />
        ) : (
          <p style={{ color: "var(--ink-500)", fontSize: 13, padding: "48px 0", textAlign: "center" }}>
            No transactions yet — the trend appears once you log income and expenses.
          </p>
        )}
      </div>

      <div className="grid grid-2">
        <div className="glass-card card-pad">
          <h3 style={{ fontWeight: 600, marginBottom: 14, fontSize: 15 }}>Assets</h3>
          {accounts.length === 0 && goals.length === 0 && (
            <p style={{ color: "var(--ink-500)", fontSize: 13 }}>No accounts or savings recorded yet.</p>
          )}
          {accounts.map((a) => (
            <div key={a.name} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--card-border)", fontSize: 13.5 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Icon name={a.icon || "wallet"} size={15} style={{ color: "var(--rose-600)" }} /> {a.name}
              </span>
              <strong>{fmt(a.balance)}</strong>
            </div>
          ))}
          {goals.map((g) => (
            <div key={g.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--card-border)", fontSize: 13.5 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Icon name="target" size={15} style={{ color: "var(--green)" }} /> {g.name} <span className="chip">goal</span>
              </span>
              <strong>{fmt(g.saved)}</strong>
            </div>
          ))}
        </div>

        <div className="glass-card card-pad">
          <h3 style={{ fontWeight: 600, marginBottom: 14, fontSize: 15 }}>Liabilities</h3>
          {debts.length === 0 && (
            <p style={{ color: "var(--ink-500)", fontSize: 13 }}>No debts added — record loans, credit cards or money owed below.</p>
          )}
          {debts.map((d) => (
            <div key={d.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--card-border)", fontSize: 13.5 }}>
              <span>{d.name}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <strong style={{ color: "var(--red)" }}>-{fmt(d.amount)}</strong>
                <button
                  className="btn btn-ghost btn-sm"
                  data-tip="Remove"
                  onClick={() => saveDebts(debts.filter((x) => x.id !== d.id))}
                >
                  <Icon name="trash-2" size={13} />
                </button>
              </span>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <input
              type="text"
              placeholder="e.g. Car loan"
              value={debtName}
              onChange={(e) => setDebtName(e.target.value)}
              style={{ flex: 1, padding: "10px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)", fontSize: 13 }}
            />
            <input
              type="number"
              placeholder="Amount"
              value={debtAmount}
              onChange={(e) => setDebtAmount(e.target.value)}
              style={{ width: 110, padding: "10px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)", fontSize: 13 }}
            />
            <button className="btn btn-primary" onClick={addDebt} disabled={!debtName.trim() || !debtAmount}>
              <Icon name="plus" size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
