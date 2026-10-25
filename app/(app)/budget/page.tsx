"use client";

import { FormEvent, useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { gbp } from "@/lib/format";
import Icon from "@/components/Icon";
import ProgressBar from "@/components/ProgressBar";
import Modal from "@/components/Modal";
import type { Budget } from "@/lib/types";

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
          <label>Monthly budget (£)</label>
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
  const { budgets, month, setMonth } = useAppData();
  const [editing, setEditing] = useState<Budget | null>(null);
  const totalBudget = budgets.reduce((s, b) => s + b.budget, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Budget Planner</h2>
          <p className="section-sub">{month} — track spending against your monthly plan</p>
        </div>
        <select className="month-select" value={month} onChange={(e) => setMonth(e.target.value)}>
          <option>May 2025</option>
          <option>June 2025</option>
        </select>
      </div>
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
                const pct = Math.round((b.spent / b.budget) * 100);
                const st = budgetStatus(pct);
                const remaining = b.budget - b.spent;
                return (
                  <tr key={b.category}>
                    <td style={{ fontWeight: 700 }}>{b.category}</td>
                    <td>{gbp(b.budget)}</td>
                    <td>{gbp(b.spent)}</td>
                    <td style={{ color: remaining < 0 ? "var(--red)" : "var(--ink-900)" }}>{gbp(remaining)}</td>
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
                <td>Total</td>
                <td>{gbp(totalBudget)}</td>
                <td>{gbp(totalSpent)}</td>
                <td>{gbp(totalBudget - totalSpent)}</td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      {editing && <EditBudgetModal budget={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
