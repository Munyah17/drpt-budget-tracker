"use client";

import Link from "next/link";
import { useAppData } from "@/lib/AppDataContext";
import { CATEGORY_COLORS } from "@/lib/data";
import {  fmt, ukDate , sym } from "@/lib/format";
import CountUp from "@/components/CountUp";
import Icon from "@/components/Icon";
import BarChart from "@/components/charts/BarChart";
import DonutChart from "@/components/charts/DonutChart";
import NoSpendChallenge from "@/components/NoSpendChallenge";

const monthLabel = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });

export default function DashboardPage() {
  const { totalIncome, totalExpenses, totalBalance, categorySpend, expenses, income, bills, budgets } = useAppData();
  const remaining = totalIncome - totalExpenses;
  const recent = expenses.slice(0, 3);
  const upcoming = bills.filter((b) => b.status === "upcoming").slice(0, 2);

  // Weekly income vs expense split for the current month
  const now = new Date();
  const inMonth = (d: string) => {
    const t = new Date(d);
    return t.getMonth() === now.getMonth() && t.getFullYear() === now.getFullYear();
  };
  const weekOf = (d: string) => Math.min(3, Math.floor((new Date(d).getDate() - 1) / 7));
  const incW = [0, 0, 0, 0];
  const expW = [0, 0, 0, 0];
  income.filter((i) => inMonth(i.date)).forEach((i) => (incW[weekOf(i.date)] += i.amount));
  expenses.filter((e) => inMonth(e.date)).forEach((e) => (expW[weekOf(e.date)] += e.amount));
  const hasChartData = incW.some((v) => v > 0) || expW.some((v) => v > 0);
  const topCategory = Object.entries(categorySpend).sort((a, b) => b[1] - a[1])[0];

  // ── Financial health score (0–100) ──
  const savingsRate = totalIncome > 0 ? Math.max(0, (totalIncome - totalExpenses) / totalIncome) : 0;
  const budgetOk = budgets.length
    ? budgets.filter((b) => b.budget > 0 && b.spent <= b.budget).length / budgets.length
    : null;
  const cutoff30 = new Date(now.getTime() - 30 * 864e5);
  const recentCount = expenses.filter((e) => new Date(e.date) >= cutoff30).length
    + income.filter((i) => new Date(i.date) >= cutoff30).length;
  const healthScore = Math.round(
    Math.min(40, savingsRate * 100 * 0.8) +
    (budgetOk === null ? 20 : budgetOk * 30) +
    Math.min(30, recentCount * 3)
  );
  const healthLabel = healthScore >= 70 ? "Great shape" : healthScore >= 40 ? "Getting there" : "Needs attention";
  const healthColor = healthScore >= 70 ? "var(--green)" : healthScore >= 40 ? "#d97706" : "var(--red)";

  // ── Safe to spend today ──
  const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate() + 1;
  const safeToday = remaining > 0 ? remaining / daysLeft : 0;

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
            <CountUp end={totalBalance} prefix={sym()} />
          </div>
          <span className="stat-delta" style={{ color: "var(--green)" }}>—</span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">Monthly Income</span>
            <div className="stat-icon" style={{ background: "rgba(26,156,109,.12)", color: "var(--green)" }}>
              <Icon name="trending-up" size={17} />
            </div>
          </div>
          <div className="stat-value">
            <CountUp end={totalIncome} prefix={sym()} />
          </div>
          <span className="stat-delta" style={{ color: "var(--green)" }}>—</span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">Monthly Expenses</span>
            <div className="stat-icon" style={{ background: "rgba(224,38,75,.12)", color: "var(--red)" }}>
              <Icon name="trending-down" size={17} />
            </div>
          </div>
          <div className="stat-value">
            <CountUp end={totalExpenses} prefix={sym()} />
          </div>
          <span className="stat-delta" style={{ color: "var(--red)" }}>—</span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">Remaining Budget</span>
            <div className="stat-icon" style={{ background: "var(--pink-100)", color: "var(--rose-600)" }}>
              <Icon name="piggy-bank" size={17} />
            </div>
          </div>
          <div className="stat-value">
            <CountUp end={remaining} prefix={sym()} />
          </div>
          <span className="stat-delta" style={{ color: "var(--ink-500)" }}>—</span>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">Financial Health</span>
            <div className="stat-icon" style={{ background: "var(--pink-100)", color: "var(--rose-600)" }}>
              <Icon name="heart" size={17} />
            </div>
          </div>
          <div className="stat-value" style={{ color: healthColor }}>
            <CountUp end={healthScore} />
            <span style={{ fontSize: 16, color: "var(--ink-500)" }}>/100</span>
          </div>
          <span className="stat-delta" style={{ color: healthColor }}>{healthLabel}</span>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">Safe to Spend Today</span>
            <div className="stat-icon" style={{ background: "var(--pink-100)", color: "var(--rose-600)" }}>
              <Icon name="wallet" size={17} />
            </div>
          </div>
          <div className="stat-value">
            <CountUp end={safeToday} prefix={sym()} />
          </div>
          <span className="stat-delta" style={{ color: "var(--ink-500)" }}>
            {daysLeft} days left in {monthLabel.split(" ")[0]}
          </span>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr", marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>Income vs Expenses</h3>
            <span className="chip">{monthLabel}</span>
          </div>
          {hasChartData ? (
            <BarChart
              labels={["Week 1", "Week 2", "Week 3", "Week 4"]}
              series={[
                { name: "Income", color: "#1a9c6d", data: incW },
                { name: "Expenses", color: "#e91e63", data: expW },
              ]}
            />
          ) : (
            <p style={{ color: "var(--ink-500)", fontSize: 13, padding: "40px 0", textAlign: "center" }}>
              No transactions logged this month yet.
            </p>
          )}
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
          {recent.length === 0 && (
            <p style={{ color: "var(--ink-500)", fontSize: 13, padding: "16px 0" }}>No transactions yet — add your first expense.</p>
          )}
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
                <div className="amt-neg">-{fmt(e.amount)}</div>
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
          {upcoming.length === 0 && (
            <p style={{ color: "var(--ink-500)", fontSize: 13, padding: "16px 0" }}>No upcoming bills.</p>
          )}
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
                <div style={{ fontWeight: 700 }}>{fmt(b.amount)}</div>
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
            {topCategory
              ? `Your biggest spend category this month is ${topCategory[0]} at ${fmt(topCategory[1])}.`
              : "Log your first income or expense and I'll start finding insights for you."}
          </p>
          <Link href="/ai" className="btn btn-ghost" style={{ background: "#ffffff22", color: "#fff", borderColor: "#ffffff33" }}>
            Ask AI Assistant
          </Link>
        </div>
        <NoSpendChallenge />
      </div>
    </>
  );
}
