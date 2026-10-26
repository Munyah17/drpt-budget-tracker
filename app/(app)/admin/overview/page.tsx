"use client";

import { useAppData } from "@/lib/AppDataContext";
import { CATEGORY_COLORS } from "@/lib/data";
import BarChart from "@/components/charts/BarChart";
import LineChart from "@/components/charts/LineChart";
import DonutChart from "@/components/charts/DonutChart";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function AdminOverviewPage() {
  const { income, expenses, categorySpend } = useAppData();

  // Real monthly totals for the last 6 months
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
  const hasData = incM.some((v) => v > 0) || expM.some((v) => v > 0);
  const hasSpend = Object.keys(categorySpend).length > 0;
  const labels = months.map((m) => m.label);

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Platform Overview</h2>
          <p className="section-sub">Super Admin command centre</p>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">Monthly Revenue</div>
          <div className="stat-value">—</div>
          <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 4 }}>Collected vs target</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Active Corporates</div>
          <div className="stat-value">—</div>
          <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 4 }}>Contracted organisations</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Covered Employees</div>
          <div className="stat-value">—</div>
          <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 4 }}>Across active partners</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Outstanding Invoices</div>
          <div className="stat-value">—</div>
          <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 4 }}>Due and overdue</div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>Income vs Expenses</h3>
          </div>
          {hasData ? (
            <BarChart
              labels={labels}
              series={[
                { name: "Income", color: "#1a9c6d", data: incM },
                { name: "Expenses", color: "#e91e63", data: expM },
              ]}
            />
          ) : (
            <p style={{ color: "var(--ink-500)", fontSize: 13, padding: "48px 0", textAlign: "center" }}>
              No transaction data yet — this chart fills in as records are added.
            </p>
          )}
        </div>

        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>Spend by Category</h3>
          </div>
          {hasSpend ? (
            <DonutChart data={categorySpend} colors={CATEGORY_COLORS} size={168} />
          ) : (
            <p style={{ color: "var(--ink-500)", fontSize: 13, padding: "48px 0", textAlign: "center" }}>
              No expenses yet — the category breakdown will appear here.
            </p>
          )}
        </div>
      </div>

      <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
        <div className="card-head">
          <h3>Monthly Cashflow</h3>
        </div>
        {hasData ? (
          <LineChart
            labels={labels}
            series={[
              { name: "Income", color: "#1a9c6d", data: incM },
              { name: "Expenses", color: "#e91e63", data: expM },
            ]}
          />
        ) : (
          <p style={{ color: "var(--ink-500)", fontSize: 13, padding: "48px 0", textAlign: "center" }}>
            No cashflow data yet — income and expense trends will appear here.
          </p>
        )}
      </div>

      <div className="glass-card card-pad">
        <div className="card-head">
          <h3>Action Queue</h3>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Type</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Description</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Assigned</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Priority</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} style={{ padding: "24px 8px", fontSize: 13, color: "var(--ink-500)", textAlign: "center" }}>
                No actions pending — issues and approvals will appear here.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
