"use client";

import { useAppData } from "@/lib/AppDataContext";
import { gbp } from "@/lib/format";
import Icon from "@/components/Icon";
import ProgressBar from "@/components/ProgressBar";

function budgetStatus(pct: number) {
  if (pct >= 100) return { color: "var(--red)", badge: "badge-red" };
  if (pct >= 85) return { color: "var(--amber)", badge: "badge-amber" };
  return { color: "var(--green)", badge: "badge-green" };
}

export default function BudgetPage() {
  const { budgets } = useAppData();
  const totalBudget = budgets.reduce((s, b) => s + b.budget, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Budget Planner</h2>
          <p className="section-sub">May 2025 — track spending against your monthly plan</p>
        </div>
        <select className="month-select">
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
                      <button className="btn btn-ghost btn-sm" data-tip="Edit budget">
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
    </>
  );
}
