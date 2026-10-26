"use client";
import { sym } from "@/lib/format";

import { useAppData } from "@/lib/AppDataContext";
import { CATEGORY_COLORS } from "@/lib/data";
import CountUp from "@/components/CountUp";
import DonutChart from "@/components/charts/DonutChart";
import LineChart from "@/components/charts/LineChart";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function AnalyticsPage() {
  const { totalIncome, totalExpenses, income, expenses, categorySpend, allTransactions } = useAppData();
  const savingsRate = totalIncome ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;
  const largestExpense = expenses.length ? Math.max(...expenses.map((e) => e.amount)) : 0;

  // Real monthly trend — last 6 months of income vs expenses
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTHS[d.getMonth()] };
  });
  const monthOf = (d: string) => {
    const t = new Date(d);
    return `${t.getFullYear()}-${t.getMonth()}`;
  };
  const incM = months.map((m) => income.filter((i) => monthOf(i.date) === m.key).reduce((s, i) => s + i.amount, 0));
  const expM = months.map((m) => expenses.filter((e) => monthOf(e.date) === m.key).reduce((s, e) => s + e.amount, 0));
  const hasTrend = incM.some((v) => v > 0) || expM.some((v) => v > 0);

  // Real daily-spend heatmap for the current month
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daySpend = new Array<number>(daysInMonth).fill(0);
  expenses
    .filter((e) => {
      const t = new Date(e.date);
      return t.getMonth() === now.getMonth() && t.getFullYear() === now.getFullYear();
    })
    .forEach((e) => { daySpend[new Date(e.date).getDate() - 1] += e.amount; });
  const dayMax = Math.max(...daySpend, 0);
  const heatmap = daySpend.map((v) => (dayMax > 0 ? v / dayMax : 0));
  const monthName = now.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Analytics</h2>
          <p className="section-sub">Deeper insight into your financial patterns</p>
        </div>
      </div>
      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card hoverable stat-card">
          <span className="stat-label">Average Daily Spend</span>
          <div className="stat-value">
            <CountUp end={totalExpenses / 31} prefix={sym()} />
          </div>
        </div>
        <div className="glass-card hoverable stat-card">
          <span className="stat-label">Savings Rate</span>
          <div className="stat-value">
            <CountUp end={savingsRate} decimals={0} />
          </div>
          <span className="stat-delta" style={{ color: "var(--ink-500)" }}>—</span>
        </div>
        <div className="glass-card hoverable stat-card">
          <span className="stat-label">Largest Expense</span>
          <div className="stat-value">
            <CountUp end={largestExpense} prefix={sym()} />
          </div>
        </div>
        <div className="glass-card hoverable stat-card">
          <span className="stat-label">Total Transactions</span>
          <div className="stat-value">
            <CountUp end={allTransactions.length} decimals={0} />
          </div>
        </div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>Spending by Category</h3>
          </div>
          <DonutChart data={categorySpend} colors={CATEGORY_COLORS} size={180} />
        </div>
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>Monthly Trend</h3>
          </div>
          {hasTrend ? (
            <LineChart
              labels={months.map((m) => m.label)}
              series={[
                { name: "Income", color: "#1a9c6d", data: incM },
                { name: "Expenses", color: "#e91e63", data: expM },
              ]}
            />
          ) : (
            <p style={{ color: "var(--ink-500)", fontSize: 13, padding: "48px 0", textAlign: "center" }}>
              No transactions yet — the trend appears once you log income and expenses.
            </p>
          )}
        </div>
      </div>
      <div className="glass-card card-pad">
        <div className="card-head">
          <h3>Spending Heatmap — {monthName}</h3>
        </div>
        <div className="cal-grid">
          {heatmap.map((intensity, idx) => {
            const bg = intensity > 0.7 ? "rgba(233,30,99,.55)" : intensity > 0.4 ? "rgba(233,30,99,.28)" : "rgba(233,30,99,.1)";
            return (
              <div
                key={idx}
                className="cal-day"
                style={{
                  background: bg,
                  color: intensity > 0.5 ? "#fff" : "var(--ink-900)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  aspectRatio: "1",
                }}
              >
                {idx + 1}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
