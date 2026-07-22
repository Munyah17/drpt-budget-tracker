"use client";

import { useEffect, useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { CATEGORY_COLORS, MONTHLY_TREND } from "@/lib/data";
import CountUp from "@/components/CountUp";
import DonutChart from "@/components/charts/DonutChart";
import LineChart from "@/components/charts/LineChart";

export default function AnalyticsPage() {
  const { totalIncome, totalExpenses, expenses, categorySpend, allTransactions } = useAppData();
  const savingsRate = totalIncome ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;
  const largestExpense = expenses.length ? Math.max(...expenses.map((e) => e.amount)) : 0;

  const [heatmap, setHeatmap] = useState<number[] | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- randomised client-only visual, computed once on mount
    setHeatmap(Array.from({ length: 31 }, () => Math.random()));
  }, []);

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Analytics</h2>
          <p className="section-sub">Deeper insight into your financial patterns</p>
        </div>
        <select className="month-select">
          <option>May 2025</option>
        </select>
      </div>
      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card hoverable stat-card">
          <span className="stat-label">Average Daily Spend</span>
          <div className="stat-value">
            <CountUp end={totalExpenses / 31} prefix="£" />
          </div>
        </div>
        <div className="glass-card hoverable stat-card">
          <span className="stat-label">Savings Rate</span>
          <div className="stat-value">
            <CountUp end={savingsRate} decimals={0} />
          </div>
          <span className="stat-delta" style={{ color: "var(--ink-500)" }}>
            %
          </span>
        </div>
        <div className="glass-card hoverable stat-card">
          <span className="stat-label">Largest Expense</span>
          <div className="stat-value">
            <CountUp end={largestExpense} prefix="£" />
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
          <LineChart
            labels={MONTHLY_TREND.labels}
            series={[
              { name: "Income", color: "#1a9c6d", data: MONTHLY_TREND.income },
              { name: "Expenses", color: "#e91e63", data: MONTHLY_TREND.expenses },
            ]}
          />
        </div>
      </div>
      <div className="glass-card card-pad">
        <div className="card-head">
          <h3>Spending Heatmap — Days of May</h3>
        </div>
        <div className="cal-grid">
          {(heatmap || Array.from({ length: 31 }, () => 0)).map((intensity, idx) => {
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
