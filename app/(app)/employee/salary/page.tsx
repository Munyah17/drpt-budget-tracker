"use client";

import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";

export default function EmployeeSalaryPage() {
  const { user } = useAppData();
  const t = useTranslations("Pages.emp_salary");

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle", { org: user?.organisation ?? t("yourOrganisation") })}</p>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statAnnualGross")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statMonthlyGross")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statMonthlyNet")}</div>
          <div className="stat-value">—</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="glass-card card-pad">
          <h3 style={{ fontWeight: 600, marginBottom: 14, fontSize: 15 }}>{t("deductionsTitle")}</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td colSpan={2} style={{ padding: "24px 8px", fontSize: 13, color: "var(--ink-500)", textAlign: "center" }}>
                  {t("noDeductions")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="glass-card card-pad">
          <h3 style={{ fontWeight: 600, marginBottom: 14, fontSize: 15 }}>{t("historyTitle")}</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
                <th style={{ padding: "10px 6px", fontWeight: 600, fontSize: 12 }}>{t("thEffective")}</th>
                <th style={{ padding: "10px 6px", fontWeight: 600, fontSize: 12 }}>{t("thAnnual")}</th>
                <th style={{ padding: "10px 6px", fontWeight: 600, fontSize: 12 }}>{t("thChange")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={3} style={{ padding: "24px 8px", fontSize: 13, color: "var(--ink-500)", textAlign: "center" }}>
                  {t("noHistory")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
