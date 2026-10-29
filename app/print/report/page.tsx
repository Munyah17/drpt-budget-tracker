"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { fmt, ukDate } from "@/lib/format";

/**
 * Monthly money report — a clean A4-style summary the browser can print
 * or save as PDF. Opens the print dialog automatically on load.
 */
export default function MonthlyReportPrintPage() {
  const t = useTranslations("Pages.print_report");
  const { user, income, expenses, budgets, goals, totalIncome, totalExpenses } = useAppData();

  useEffect(() => {
    const timer = setTimeout(() => window.print(), 600);
    return () => clearTimeout(timer);
  }, []);

  const now = new Date();
  const monthLabel = now.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const inMonth = (d: string) => {
    const date = new Date(d);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  };
  const monthInc = income.filter((i) => inMonth(i.date));
  const monthExp = expenses.filter((e) => inMonth(e.date));
  const incTotal = monthInc.reduce((s, i) => s + i.amount, 0);
  const expTotal = monthExp.reduce((s, e) => s + e.amount, 0);
  const net = incTotal - expTotal;
  const savingsRate = incTotal > 0 ? Math.round((net / incTotal) * 100) : 0;

  const byCat: Record<string, number> = {};
  monthExp.forEach((e) => (byCat[e.category] = (byCat[e.category] || 0) + e.amount));
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

  const topMerchants = [...monthExp].sort((a, b) => b.amount - a.amount).slice(0, 5);

  const h1 = { fontSize: 22, fontWeight: 800, margin: 0 } as const;
  const h2 = { fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase" as const, letterSpacing: "0.08em", margin: "28px 0 8px" };
  const row = { display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #eee", fontSize: 12.5 } as const;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 32px", fontFamily: "'Source Sans 3 Variable', Arial, sans-serif", color: "#1a1a1a", background: "#fff", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px solid #c81057", paddingBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#c81057" }}>WellSpend ❤</div>
          <h1 style={h1}>{t("title")}</h1>
          <div style={{ fontSize: 12.5, color: "#666", marginTop: 4 }}>{user?.name ?? t("accountHolder")} · {monthLabel}</div>
        </div>
        <div style={{ textAlign: "right", fontSize: 11, color: "#888" }}>
          {t("generated", { date: ukDate(now.toISOString().slice(0, 10)) })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 22 }}>
        {[
          [t("income"), fmt(incTotal), "#1a9c6d"],
          [t("expenses"), fmt(expTotal), "#e91e63"],
          [t("net"), fmt(net), net >= 0 ? "#1a9c6d" : "#e91e63"],
          [t("savingsRate"), `${Math.max(0, savingsRate)}%`, "#c81057"],
        ].map(([label, val, color]) => (
          <div key={label as string} style={{ border: "1px solid #eee", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 10.5, color: "#888", fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: color as string }}>{val}</div>
          </div>
        ))}
      </div>

      <h2 style={h2}>{t("spendingByCategory")}</h2>
      {cats.length === 0 && <p style={{ fontSize: 12.5, color: "#888" }}>{t("noExpenses")}</p>}
      {cats.map(([cat, amt]) => (
        <div key={cat} style={row}>
          <span>{cat}</span>
          <span>
            <strong>{fmt(amt)}</strong>
            <span style={{ color: "#999", marginLeft: 10, fontSize: 11 }}>
              {expTotal > 0 ? Math.round((amt / expTotal) * 100) : 0}%
            </span>
          </span>
        </div>
      ))}

      <h2 style={h2}>{t("largestExpenses")}</h2>
      {topMerchants.length === 0 && <p style={{ fontSize: 12.5, color: "#888" }}>—</p>}
      {topMerchants.map((e) => (
        <div key={e.id} style={row}>
          <span>{e.merchant} <span style={{ color: "#999", fontSize: 11 }}>· {ukDate(e.date)}</span></span>
          <strong>{fmt(e.amount)}</strong>
        </div>
      ))}

      <h2 style={h2}>{t("budgetCheckIn")}</h2>
      {budgets.length === 0 && <p style={{ fontSize: 12.5, color: "#888" }}>{t("noBudgets")}</p>}
      {budgets.map((b) => {
        const pct = b.budget > 0 ? Math.round((b.spent / b.budget) * 100) : 0;
        return (
          <div key={b.category} style={row}>
            <span>{b.category}</span>
            <span style={{ color: pct >= 100 ? "#e91e63" : undefined }}>
              {t("budgetProgress", { spent: fmt(b.spent), budget: fmt(b.budget), pct })}
            </span>
          </div>
        );
      })}

      <h2 style={h2}>{t("savingsGoals")}</h2>
      {goals.length === 0 && <p style={{ fontSize: 12.5, color: "#888" }}>{t("noGoals")}</p>}
      {goals.map((g) => (
        <div key={g.id} style={row}>
          <span>{g.name}</span>
          <span>{t("goalProgress", { saved: fmt(g.saved), target: fmt(g.target), pct: g.target > 0 ? Math.round((g.saved / g.target) * 100) : 0 })}</span>
        </div>
      ))}

      <div style={{ marginTop: 40, fontSize: 10.5, color: "#999", borderTop: "1px solid #eee", paddingTop: 12 }}>
        {t("footer", { month: monthLabel, income: fmt(totalIncome), expenses: fmt(totalExpenses) })}
      </div>
    </div>
  );
}
