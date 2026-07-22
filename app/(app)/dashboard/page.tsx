"use client";

import Link from "next/link";
import { useAppData } from "@/lib/AppDataContext";
import { CATEGORY_COLORS } from "@/lib/data";
import { gbp, ukDate } from "@/lib/format";
import CountUp from "@/components/CountUp";
import Icon from "@/components/Icon";
import BarChart from "@/components/charts/BarChart";
import DonutChart from "@/components/charts/DonutChart";

export default function DashboardPage() {
  const { totalIncome, totalExpenses, totalBalance, categorySpend, expenses, bills } = useAppData();
  const remaining = totalIncome - totalExpenses;
  const recent = expenses.slice(0, 3);
  const upcoming = bills.filter((b) => b.status === "upcoming").slice(0, 2);

  return (
    <>
      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">Total Balance</span>
            <div className="stat-icon" style={{ background: "var(--pink-100)", color: "var(--rose-600)" }}>
              <Icon name="banknote" size={17} />
            </div>
          </div>
          <div className="stat-value">
            <CountUp end={totalBalance} prefix="£" />
          </div>
          <span className="stat-delta" style={{ color: "var(--green)" }}>
            Across 4 accounts
          </span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">Monthly Income</span>
            <div className="stat-icon" style={{ background: "rgba(26,156,109,.12)", color: "var(--green)" }}>
              <Icon name="trending-up" size={17} />
            </div>
          </div>
          <div className="stat-value">
            <CountUp end={totalIncome} prefix="£" />
          </div>
          <span className="stat-delta" style={{ color: "var(--green)" }}>
            +4.2% vs April
          </span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">Monthly Expenses</span>
            <div className="stat-icon" style={{ background: "rgba(224,38,75,.12)", color: "var(--red)" }}>
              <Icon name="trending-down" size={17} />
            </div>
          </div>
          <div className="stat-value">
            <CountUp end={totalExpenses} prefix="£" />
          </div>
          <span className="stat-delta" style={{ color: "var(--red)" }}>
            -8% vs April
          </span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">Remaining Budget</span>
            <div className="stat-icon" style={{ background: "var(--pink-100)", color: "var(--rose-600)" }}>
              <Icon name="piggy-bank" size={17} />
            </div>
          </div>
          <div className="stat-value">
            <CountUp end={remaining} prefix="£" />
          </div>
          <span className="stat-delta" style={{ color: "var(--ink-500)" }}>
            On track for May
          </span>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr", marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>Income vs Expenses</h3>
            <span className="chip">May 2025</span>
          </div>
          <BarChart
            labels={["Week 1", "Week 2", "Week 3", "Week 4"]}
            series={[
              { name: "Income", color: "#1a9c6d", data: [1200, 1450, 1600, 1400] },
              { name: "Expenses", color: "#e91e63", data: [780, 900, 760, 774.75] },
            ]}
          />
        </div>
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>Category Spending</h3>
          </div>
          <DonutChart data={categorySpend} colors={CATEGORY_COLORS} size={168} />
        </div>
      </div>

      <div className="grid grid-3">
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>Recent Transactions</h3>
            <Link href="/transactions" style={{ fontSize: 12.5, color: "var(--rose-600)", fontWeight: 700 }}>
              View all
            </Link>
          </div>
          {recent.map((e) => (
            <div
              key={e.id}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--card-border)" }}
            >
              <div className="merchant-cell">
                <div className="merchant-ic">
                  <Icon name="shopping-cart" size={15} />
                </div>
                {e.merchant}
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="amt-neg">-{gbp(e.amount)}</div>
                <div style={{ fontSize: 11, color: "var(--ink-500)" }}>{ukDate(e.date)}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>Upcoming Bills</h3>
            <Link href="/bills" style={{ fontSize: 12.5, color: "var(--rose-600)", fontWeight: 700 }}>
              View all
            </Link>
          </div>
          {upcoming.map((b) => (
            <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--card-border)" }}>
              <div className="merchant-ic">
                <Icon name={b.icon} size={15} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{b.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-500)" }}>Due {ukDate(b.due)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700 }}>{gbp(b.amount)}</div>
                <span className="badge badge-amber">
                  {b.daysLeft} day{b.daysLeft === 1 ? "" : "s"} left
                </span>
              </div>
            </div>
          ))}
        </div>
        <div
          className="glass-card card-pad"
          style={{ background: "linear-gradient(160deg, var(--rose-600), var(--rose-400))", color: "#fff", border: "none" }}
        >
          <div className="card-head" style={{ marginBottom: 12 }}>
            <h3 style={{ color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="sparkles" /> AI Insight
            </h3>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.95, margin: "0 0 16px" }}>
            You spent 27% more on dining out this month compared to April. Housing remains your largest category at 34.9% of spend.
          </p>
          <Link href="/ai" className="btn btn-ghost" style={{ background: "#ffffff22", color: "#fff", borderColor: "#ffffff33" }}>
            Ask AI Assistant
          </Link>
        </div>
      </div>
    </>
  );
}
