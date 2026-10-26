"use client";

import { useMemo } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { EXPENSE_ICONS } from "@/lib/data";
import { sym, fmt, ukDate } from "@/lib/format";
import CountUp from "@/components/CountUp";
import Icon from "@/components/Icon";

// Snapshot at module load — "days since" is display-only, minute precision unnecessary.
const NOW = Date.now();

/**
 * Subscription Hunter — every recurring charge in one list, with the
 * "monthly bleed" total and a one-tap cancel (marks the item non-recurring).
 */
export default function SubscriptionsPage() {
  const { expenses, updateExpense, toast } = useAppData();

  const subs = useMemo(
    () =>
      expenses
        .filter((e) => e.recurring)
        .sort((a, b) => b.amount - a.amount),
    [expenses]
  );
  const monthlyBleed = subs.reduce((s, e) => s + e.amount, 0);
  const yearlyBleed = monthlyBleed * 12;

  function daysSince(date: string) {
    return Math.max(0, Math.floor((NOW - new Date(date).getTime()) / 864e5));
  }

  function cancelSub(id: number) {
    const e = expenses.find((x) => x.id === id);
    if (!e) return;
    updateExpense(id, { ...e, recurring: false });
    toast(`${e.merchant} marked as cancelled`, "check");
  }

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Subscription Hunter</h2>
          <p className="section-sub">Find the recurring charges quietly draining your account</p>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">Active Subscriptions</span>
            <div className="stat-icon" style={{ background: "var(--pink-100)", color: "var(--rose-600)" }}>
              <Icon name="repeat" size={17} />
            </div>
          </div>
          <div className="stat-value"><CountUp end={subs.length} decimals={0} /></div>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">Monthly Bleed</span>
            <div className="stat-icon" style={{ background: "var(--pink-100)", color: "var(--red)" }}>
              <Icon name="wallet" size={17} />
            </div>
          </div>
          <div className="stat-value"><CountUp end={monthlyBleed} prefix={sym()} /></div>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">Yearly Bleed</span>
            <div className="stat-icon" style={{ background: "var(--pink-100)", color: "var(--red)" }}>
              <Icon name="trending-up" size={17} />
            </div>
          </div>
          <div className="stat-value"><CountUp end={yearlyBleed} prefix={sym()} /></div>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">Largest</span>
            <div className="stat-icon" style={{ background: "var(--pink-100)", color: "var(--rose-600)" }}>
              <Icon name="zap" size={17} />
            </div>
          </div>
          <div className="stat-value">
            <CountUp end={subs.length ? subs[0].amount : 0} prefix={sym()} />
          </div>
          {subs.length > 0 && (
            <span className="stat-delta" style={{ color: "var(--ink-500)" }}>{subs[0].merchant}</span>
          )}
        </div>
      </div>

      <div className="glass-card card-pad">
        <div className="card-head"><h3>Recurring Charges</h3></div>
        {subs.length === 0 ? (
          <p style={{ color: "var(--ink-500)", fontSize: 13, padding: "24px 0", textAlign: "center" }}>
            No recurring expenses found — mark any expense as recurring and it will be hunted down here.
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Category</th>
                  <th>Last Charged</th>
                  <th style={{ textAlign: "right" }}>Monthly Cost</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {subs.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <div className="merchant-cell">
                        <div className="merchant-ic">
                          <Icon name={EXPENSE_ICONS[e.category] || "circle"} size={15} />
                        </div>
                        {e.merchant}
                      </div>
                    </td>
                    <td><span className="chip">{e.category}</span></td>
                    <td>
                      {ukDate(e.date)}
                      <span style={{ fontSize: 11, color: "var(--ink-500)", marginLeft: 8 }}>
                        {daysSince(e.date)}d ago
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }} className="amt-neg">-{fmt(e.amount)}</td>
                    <td style={{ textAlign: "right" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => cancelSub(e.id)}>
                        <Icon name="x" size={13} style={{ marginRight: 4 }} /> Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
