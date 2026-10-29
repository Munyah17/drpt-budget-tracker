"use client";

import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";

export default function EmployeeHomePage() {
  const { user } = useAppData();
  const t = useTranslations("Pages.emp_home");

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle", { org: user?.organisation ?? t("yourOrganisation") })}</p>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statNetPay")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statNextPayDate")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statLeaveBalance")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statBenefitsEnrolled")}</div>
          <div className="stat-value">—</div>
        </div>
      </div>

      <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <Icon name="briefcase" size={18} style={{ color: "var(--rose-600)" }} />
          <h3 style={{ fontWeight: 600, fontSize: 15 }}>{t("employmentDetails")}</h3>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td style={{ padding: "10px 6px", fontSize: 13, color: "var(--ink-500)", width: 180 }}>{t("labelOrganisation")}</td>
              <td style={{ padding: "10px 6px", fontWeight: 600 }}>{user?.organisation ?? "—"}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td style={{ padding: "10px 6px", fontSize: 13, color: "var(--ink-500)" }}>{t("labelDepartment")}</td>
              <td style={{ padding: "10px 6px" }}>—</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td style={{ padding: "10px 6px", fontSize: 13, color: "var(--ink-500)" }}>{t("labelJobTitle")}</td>
              <td style={{ padding: "10px 6px" }}>—</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td style={{ padding: "10px 6px", fontSize: 13, color: "var(--ink-500)" }}>{t("labelContractType")}</td>
              <td style={{ padding: "10px 6px" }}>—</td>
            </tr>
            <tr>
              <td style={{ padding: "10px 6px", fontSize: 13, color: "var(--ink-500)" }}>{t("labelStartDate")}</td>
              <td style={{ padding: "10px 6px" }}>—</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="glass-card card-pad">
        <h3 style={{ fontWeight: 600, marginBottom: 14, fontSize: 15 }}>{t("recentPayslips")}</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "10px 6px", fontWeight: 600, fontSize: 12 }}>{t("thPeriod")}</th>
              <th style={{ padding: "10px 6px", fontWeight: 600, fontSize: 12 }}>{t("thNetPay")}</th>
              <th style={{ padding: "10px 6px", fontWeight: 600, fontSize: 12 }}>{t("thStatus")}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={3} style={{ padding: "24px 8px", fontSize: 13, color: "var(--ink-500)", textAlign: "center" }}>
                {t("noPayslips")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
