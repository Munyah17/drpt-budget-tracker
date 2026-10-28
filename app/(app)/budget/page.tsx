"use client";

import { FormEvent, useMemo, useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import {  fmt , sym } from "@/lib/format";
import Icon from "@/components/Icon";
import ProgressBar from "@/components/ProgressBar";
import Modal from "@/components/Modal";
import Envelopes from "@/components/Envelopes";
import type { Budget } from "@/lib/types";
import { useFinancePrefs, updatePrefs, rolloverPool, whatsappLink, SinkingFund } from "@/lib/financeInsights";

function budgetStatus(pct: number) {
  if (pct >= 100) return { color: "var(--red)", badge: "badge-red" };
  if (pct >= 85) return { color: "var(--amber)", badge: "badge-amber" };
  return { color: "var(--green)", badge: "badge-green" };
}

function EditBudgetModal({ budget, onClose }: { budget: Budget; onClose: () => void }) {
  const { updateBudget, toast } = useAppData();
  const [amount, setAmount] = useState(String(budget.budget));

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    updateBudget(budget.category, parseFloat(amount) || 0);
    toast(`Budget for ${budget.category} updated`);
    onClose();
  }

  return (
    <Modal title={`Edit ${budget.category} Budget`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Monthly budget ({sym()})</label>
          <input required type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit">
          Save Budget
        </button>
      </form>
    </Modal>
  );
}

export default function BudgetPage() {
  const { budgets, month, expenses, toast } = useAppData();
  const prefs = useFinancePrefs();
  const [editing, setEditing] = useState<Budget | null>(null);
  const [addingFund, setAddingFund] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [fundName, setFundName] = useState("");
  const [fundTarget, setFundTarget] = useState("");
  const [fundMonth, setFundMonth] = useState("");
  const [memberName, setMemberName] = useState("");
  const [memberShare, setMemberShare] = useState("50");

  const pool = useMemo(() => rolloverPool(budgets, expenses, prefs.rollover), [budgets, expenses, prefs.rollover]);
  const effBudget = (b: Budget) => b.budget + Math.max(0, pool[b.category] ?? 0);
  const totalBudget = budgets.reduce((s, b) => s + effBudget(b), 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  function addFund(e: FormEvent) {
    e.preventDefault();
    const target = parseFloat(fundTarget) || 0;
    const monthsLeft = fundMonth ? Math.max(1, Math.ceil((new Date(fundMonth + "-01").getTime() - Date.now()) / (30.4 * 864e5))) : 1;
    const fund: SinkingFund = {
      id: `sf-${Date.now().toString(36)}`, name: fundName, target,
      perMonth: Math.ceil(target / monthsLeft), saved: 0, dueMonth: fundMonth,
    };
    updatePrefs((p) => ({ ...p, sinking: [...p.sinking, fund] }));
    toast(`Sinking fund "${fundName}" created — put aside ${fmt(fund.perMonth)}/month`, "piggy-bank");
    setAddingFund(false); setFundName(""); setFundTarget(""); setFundMonth("");
  }

  function contribute(f: SinkingFund, amount: number) {
    updatePrefs((p) => ({
      ...p,
      sinking: p.sinking.map((x) => (x.id === f.id ? { ...x, saved: Math.min(x.target, x.saved + amount) } : x)),
    }));
  }

  function addMember(e: FormEvent) {
    e.preventDefault();
    updatePrefs((p) => ({ ...p, household: [...p.household, { name: memberName, share: parseFloat(memberShare) || 50 }] }));
    setAddingMember(false); setMemberName("");
  }

  function shareBudget(name: string, share: number) {
    const lines = budgets.map((b) => `${b.category}: ${fmt(b.budget * share / 100)}`);
    const text = `Household budget — ${month}\n${name}'s share (${share}%):\n${lines.join("\n")}\nTotal: ${fmt(totalBudget * share / 100)}`;
    window.open(whatsappLink("", text), "_blank");
    toast(`Budget summary opened in WhatsApp for ${name}`, "send");
  }

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Budget Planner</h2>
          <p className="section-sub">{month} — track spending against your monthly plan</p>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }} title="Unspent budget carries into next month">
          <input type="checkbox" checked={prefs.rollover} onChange={(e) => updatePrefs((p) => ({ ...p, rollover: e.target.checked }))} />
          Rollover unspent
        </label>
      </div>
      <Envelopes />
      <div className="glass-card card-pad">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Budget</th>
                <th>Spent</th>
                <th>Remaining</th>
                <th style={{ width: 220 }}>Progress</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {budgets.map((b) => {
                const eff = effBudget(b);
                const carry = Math.max(0, pool[b.category] ?? 0);
                const pct = eff > 0 ? Math.round((b.spent / eff) * 100) : 0;
                const st = budgetStatus(pct);
                const remaining = eff - b.spent;
                return (
                  <tr key={b.category}>
                    <td style={{ fontWeight: 700 }}>{b.category}</td>
                    <td>
                      {fmt(eff)}
                      {carry > 0 && <div style={{ fontSize: 10, color: "var(--green)" }}>+{fmt(carry)} carried</div>}
                    </td>
                    <td>{fmt(b.spent)}</td>
                    <td style={{ color: remaining < 0 ? "var(--red)" : "var(--ink-900)" }}>{fmt(remaining)}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <ProgressBar pct={Math.min(pct, 100)} color={st.color} />
                        <span className={"badge " + st.badge}>{pct}%</span>
                      </div>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" data-tip="Edit budget" onClick={() => setEditing(b)}>
                        <Icon name="pencil" size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              <tr style={{ fontWeight: 800 }}>
                <td>Total{prefs.rollover && " (incl. rollover)"}</td>
                <td>{fmt(totalBudget)}</td>
                <td>{fmt(totalSpent)}</td>
                <td>{fmt(totalBudget - totalSpent)}</td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      {/* ── Sinking funds — smooth irregular expenses into monthly set-asides ── */}
      <div className="glass-card card-pad" style={{ marginTop: 20 }}>
        <div className="card-head">
          <h3>Sinking Funds <span style={{ fontSize: 12, color: "var(--ink-500)", fontWeight: 400 }}>— save monthly for big irregular costs</span></h3>
          <button className="btn btn-ghost btn-sm" onClick={() => setAddingFund(true)}><Icon name="plus" size={13} style={{ marginRight: 4 }} />New Fund</button>
        </div>
        {prefs.sinking.length === 0 ? (
          <p style={{ color: "var(--ink-500)", fontSize: 13, padding: "12px 0" }}>No funds yet — try one for car service, school fees or December holidays.</p>
        ) : (
          <div className="grid grid-3">
            {prefs.sinking.map((f) => {
              const pct = Math.min(100, Math.round((f.saved / Math.max(f.target, 1)) * 100));
              return (
                <div key={f.id} style={{ border: "1px solid var(--card-border)", borderRadius: "var(--radius-sm)", padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <b style={{ fontSize: 14 }}>{f.name}</b>
                    <button className="btn btn-ghost" style={{ padding: "2px 6px", fontSize: 11, color: "var(--red)" }}
                      onClick={() => updatePrefs((p) => ({ ...p, sinking: p.sinking.filter((x) => x.id !== f.id) }))}>
                      <Icon name="trash-2" size={12} />
                    </button>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-500)", marginBottom: 8 }}>
                    {fmt(f.saved)} of {fmt(f.target)} · {f.dueMonth || "no due date"} · {fmt(f.perMonth)}/mo
                  </div>
                  <ProgressBar pct={pct} color={pct >= 100 ? "var(--green)" : "var(--rose-600)"} />
                  <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => contribute(f, f.perMonth)}>
                    <Icon name="plus" size={12} style={{ marginRight: 4 }} />Log {fmt(f.perMonth)} set aside
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Household — split the budget with a partner and share over WhatsApp ── */}
      <div className="glass-card card-pad" style={{ marginTop: 20 }}>
        <div className="card-head">
          <h3>Household <span style={{ fontSize: 12, color: "var(--ink-500)", fontWeight: 400 }}>— share each person&apos;s budget share</span></h3>
          <button className="btn btn-ghost btn-sm" onClick={() => setAddingMember(true)}><Icon name="plus" size={13} style={{ marginRight: 4 }} />Add Member</button>
        </div>
        {prefs.household.length === 0 ? (
          <p style={{ color: "var(--ink-500)", fontSize: 13, padding: "12px 0" }}>Add a partner or family member, then send them their share of the budget via WhatsApp.</p>
        ) : (
          prefs.household.map((m, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--card-border)", flexWrap: "wrap", gap: 8 }}>
              <div>
                <b>{m.name}</b> <span style={{ color: "var(--ink-500)", fontSize: 12.5 }}>· {m.share}% share · {fmt(totalBudget * m.share / 100)}</span>
              </div>
              <div>
                <button className="btn btn-ghost btn-sm" onClick={() => shareBudget(m.name, m.share)}><Icon name="send" size={13} style={{ marginRight: 4 }} />WhatsApp their share</button>
                <button className="btn btn-ghost btn-sm" style={{ color: "var(--red)" }}
                  onClick={() => updatePrefs((p) => ({ ...p, household: p.household.filter((_, j) => j !== i) }))}>
                  <Icon name="trash-2" size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {editing && <EditBudgetModal budget={editing} onClose={() => setEditing(null)} />}
      {addingFund && (
        <Modal title="New Sinking Fund" onClose={() => setAddingFund(false)}>
          <form onSubmit={addFund}>
            <div className="field"><label>Name</label><input required value={fundName} onChange={(e) => setFundName(e.target.value)} placeholder="Car service" /></div>
            <div className="field"><label>Target ({sym()})</label><input required type="number" min="1" step="0.01" value={fundTarget} onChange={(e) => setFundTarget(e.target.value)} /></div>
            <div className="field"><label>Needed by (month)</label><input type="month" value={fundMonth} onChange={(e) => setFundMonth(e.target.value)} /></div>
            <button className="btn btn-primary" style={{ width: "100%" }} type="submit">Create Fund</button>
          </form>
        </Modal>
      )}
      {addingMember && (
        <Modal title="Add Household Member" onClose={() => setAddingMember(false)}>
          <form onSubmit={addMember}>
            <div className="field"><label>Name</label><input required value={memberName} onChange={(e) => setMemberName(e.target.value)} placeholder="Partner's name" /></div>
            <div className="field"><label>Budget share (%)</label><input required type="number" min="1" max="100" value={memberShare} onChange={(e) => setMemberShare(e.target.value)} /></div>
            <button className="btn btn-primary" style={{ width: "100%" }} type="submit">Add Member</button>
          </form>
        </Modal>
      )}
    </>
  );
}
