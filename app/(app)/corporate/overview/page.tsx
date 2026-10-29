"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Icon from "@/components/Icon";

export default function CorporateOverviewPage() {
  const router = useRouter();
  const t = useTranslations("Pages.corp_overview");
  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={() => router.push("/corporate/employees/onboarding")}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          {t("addEmployee")}
        </button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statTotalEmployees")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statActiveThisMonth")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statPayrollThisMonth")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statPendingOnboarding")}</div>
          <div className="stat-value">—</div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <h3 style={{ fontWeight: 600, marginBottom: 16, fontSize: 15 }}>{t("recentPayrollRuns")}</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
                <th style={{ padding: "10px 6px", fontWeight: 600, fontSize: 12 }}>{t("thPeriod")}</th>
                <th style={{ padding: "10px 6px", fontWeight: 600, fontSize: 12 }}>{t("thAmount")}</th>
                <th style={{ padding: "10px 6px", fontWeight: 600, fontSize: 12 }}>{t("thStatus")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={3} style={{ padding: "24px 8px", fontSize: 13, color: "var(--ink-500)", textAlign: "center" }}>
                  {t("emptyPayroll")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="glass-card card-pad">
          <h3 style={{ fontWeight: 600, marginBottom: 16, fontSize: 15 }}>{t("pendingTasks")}</h3>
          <p style={{ color: "var(--ink-500)", fontSize: 13, padding: "16px 0" }}>
            {t("emptyTasks")}
          </p>
        </div>
      </div>

      <div className="glass-card card-pad">
        <h3 style={{ fontWeight: 600, marginBottom: 16, fontSize: 15 }}>{t("departmentBreakdown")}</h3>
        <div className="grid grid-4">
          <div>
            <div className="stat-label">{t("deptEngineering")}</div>
            <div className="stat-value" style={{ fontSize: 22 }}>—</div>
          </div>
          <div>
            <div className="stat-label">{t("deptSales")}</div>
            <div className="stat-value" style={{ fontSize: 22 }}>—</div>
          </div>
          <div>
            <div className="stat-label">{t("deptOperations")}</div>
            <div className="stat-value" style={{ fontSize: 22 }}>—</div>
          </div>
          <div>
            <div className="stat-label">{t("deptFinanceAdmin")}</div>
            <div className="stat-value" style={{ fontSize: 22 }}>—</div>
          </div>
        </div>
      </div>
    </>
  );
}
