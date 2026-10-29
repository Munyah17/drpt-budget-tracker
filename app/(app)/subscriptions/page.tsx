"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { EXPENSE_ICONS } from "@/lib/data";
import { sym, fmt, ukDate } from "@/lib/format";
import CountUp from "@/components/CountUp";
import Icon from "@/components/Icon";
import { detectRecurring } from "@/lib/financeInsights";

// Snapshot at module load — "days since" is display-only, minute precision unnecessary.
const NOW = Date.now();

/**
 * Subscription Hunter — every recurring charge in one list, with the
 * "monthly bleed" total and a one-tap cancel (marks the item non-recurring).
 */
export default function SubscriptionsPage() {
  const t = useTranslations("Pages.subscriptions");
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
    toast(t("toastCancelled", { merchant: e.merchant }), "check");
  }

  // Auto-detected likely subscriptions the user hasn't flagged yet
  const detected = useMemo(() => detectRecurring(expenses), [expenses]);

  // Renewal alerts: recurring charge expected again within 5 days of its usual cycle
  const renewals = useMemo(
    () =>
      subs
        .map((e) => ({ e, next: new Date(e.date).getTime() + 30.4 * 864e5 }))
        .filter(({ next }) => next - NOW < 5 * 864e5)
        .sort((a, b) => a.next - b.next),
    [subs]
  );

  function flagAsSub(ids: number[], merchant: string) {
    for (const id of ids) {
      const e = expenses.find((x) => x.id === id);
      if (e && !e.recurring) updateExpense(id, { ...e, recurring: true });
    }
    toast(t("toastFlagged", { merchant }), "check-circle");
  }

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("sub")}</p>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">{t("statActive")}</span>
            <div className="stat-icon" style={{ background: "var(--pink-100)", color: "var(--rose-600)" }}>
              <Icon name="repeat" size={17} />
            </div>
          </div>
          <div className="stat-value"><CountUp end={subs.length} decimals={0} /></div>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">{t("statMonthly")}</span>
            <div className="stat-icon" style={{ background: "var(--pink-100)", color: "var(--red)" }}>
              <Icon name="wallet" size={17} />
            </div>
          </div>
          <div className="stat-value"><CountUp end={monthlyBleed} prefix={sym()} /></div>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">{t("statYearly")}</span>
            <div className="stat-icon" style={{ background: "var(--pink-100)", color: "var(--red)" }}>
              <Icon name="trending-up" size={17} />
            </div>
          </div>
          <div className="stat-value"><CountUp end={yearlyBleed} prefix={sym()} /></div>
        </div>
        <div className="glass-card hoverable stat-card">
          <div className="stat-top">
            <span className="stat-label">{t("statLargest")}</span>
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

      {renewals.length > 0 && (
        <div className="glass-card card-pad" style={{ marginBottom: 20, borderLeft: "3px solid var(--amber)" }}>
          <div className="card-head">
            <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}><Icon name="bell" size={16} /> {t("renewals")}</h3>
          </div>
          {renewals.map(({ e }) => (
            <div key={e.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--card-border)", fontSize: 13.5 }}>
              <span>{e.merchant}</span>
              <b className="amt-neg">-{fmt(e.amount)}</b>
            </div>
          ))}
        </div>
      )}

      {detected.length > 0 && (
        <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
          <div className="card-head">
            <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}><Icon name="sparkles" size={16} /> {t("detected")}</h3>
          </div>
          {detected.map((d) => (
            <div key={d.merchant} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--card-border)", flexWrap: "wrap" }}>
              <div>
                <b>{d.merchant}</b>{" "}
                <span style={{ color: "var(--ink-500)", fontSize: 12.5 }}>
                  {t("detectedMeta", { amount: fmt(d.amount), count: d.count, days: Math.round(d.avgDays) })}
                </span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => flagAsSub(d.ids, d.merchant)}>
                <Icon name="repeat" size={13} style={{ marginRight: 4 }} />{t("confirmRecurring")}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="glass-card card-pad">
        <div className="card-head"><h3>{t("charges")}</h3></div>
        {subs.length === 0 ? (
          <p style={{ color: "var(--ink-500)", fontSize: 13, padding: "24px 0", textAlign: "center" }}>
            {t("empty")}
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t("colService")}</th>
                  <th>{t("colCategory")}</th>
                  <th>{t("colLast")}</th>
                  <th style={{ textAlign: "right" }}>{t("colCost")}</th>
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
                        {t("daysAgo", { days: daysSince(e.date) })}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }} className="amt-neg">-{fmt(e.amount)}</td>
                    <td style={{ textAlign: "right" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => cancelSub(e.id)}>
                        <Icon name="x" size={13} style={{ marginRight: 4 }} /> {t("cancel")}
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
