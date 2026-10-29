"use client";

import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { CATEGORY_COLORS } from "@/lib/data";
import BarChart from "@/components/charts/BarChart";
import LineChart from "@/components/charts/LineChart";
import DonutChart from "@/components/charts/DonutChart";

export default function AdminOverviewPage() {
  const t = useTranslations("Pages.adm_overview");
  const { income, expenses, categorySpend } = useAppData();
  const MONTHS = [
    t("monthJan"), t("monthFeb"), t("monthMar"), t("monthApr"),
    t("monthMay"), t("monthJun"), t("monthJul"), t("monthAug"),
    t("monthSep"), t("monthOct"), t("monthNov"), t("monthDec"),
  ];

  // Real monthly totals for the last 6 months
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTHS[d.getMonth()] };
  });
  const monthOf = (d: string) => {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${dt.getMonth()}`;
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
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statMonthlyRevenue")}</div>
          <div className="stat-value">—</div>
          <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 4 }}>{t("statMonthlyRevenueSub")}</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statActiveCorporates")}</div>
          <div className="stat-value">—</div>
          <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 4 }}>{t("statActiveCorporatesSub")}</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statCoveredEmployees")}</div>
          <div className="stat-value">—</div>
          <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 4 }}>{t("statCoveredEmployeesSub")}</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statOutstandingInvoices")}</div>
          <div className="stat-value">—</div>
          <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 4 }}>{t("statOutstandingInvoicesSub")}</div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>{t("incomeVsExpenses")}</h3>
          </div>
          {hasData ? (
            <BarChart
              labels={labels}
              series={[
                { name: t("seriesIncome"), color: "#1a9c6d", data: incM },
                { name: t("seriesExpenses"), color: "#e91e63", data: expM },
              ]}
            />
          ) : (
            <p style={{ color: "var(--ink-500)", fontSize: 13, padding: "48px 0", textAlign: "center" }}>
              {t("noTransactionData")}
            </p>
          )}
        </div>

        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>{t("spendByCategory")}</h3>
          </div>
          {hasSpend ? (
            <DonutChart data={categorySpend} colors={CATEGORY_COLORS} size={168} />
          ) : (
            <p style={{ color: "var(--ink-500)", fontSize: 13, padding: "48px 0", textAlign: "center" }}>
              {t("noExpensesYet")}
            </p>
          )}
        </div>
      </div>

      <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
        <div className="card-head">
          <h3>{t("monthlyCashflow")}</h3>
        </div>
        {hasData ? (
          <LineChart
            labels={labels}
            series={[
              { name: t("seriesIncome"), color: "#1a9c6d", data: incM },
              { name: t("seriesExpenses"), color: "#e91e63", data: expM },
            ]}
          />
        ) : (
          <p style={{ color: "var(--ink-500)", fontSize: 13, padding: "48px 0", textAlign: "center" }}>
            {t("noCashflowData")}
          </p>
        )}
      </div>

      <div className="glass-card card-pad">
        <div className="card-head">
          <h3>{t("actionQueue")}</h3>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thType")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thDescription")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thStatus")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thAssigned")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thPriority")}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} style={{ padding: "24px 8px", fontSize: 13, color: "var(--ink-500)", textAlign: "center" }}>
                {t("noActionsPending")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
