"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useAppData } from "@/lib/AppDataContext";
import { useCorpStore } from "@/lib/corpStore";
import { accruedWages } from "@/lib/ewa";
import { usd } from "@/lib/payslip";
import Icon from "@/components/Icon";

const NETPAY_KEY = "drpt-emp-netpay";

export default function EmployeeHomePage() {
  const { user } = useAppData();
  const t = useTranslations("Pages.emp_home");
  const store = useCorpStore();

  const directoryMatch = store.employees.find(
    (e) => e.name === user?.name || e.email === user?.email
  );
  const storedNet = typeof window !== "undefined" ? Number(localStorage.getItem(NETPAY_KEY) || 0) : 0;
  const netPay = directoryMatch ? Math.round(directoryMatch.grossPay * 0.75 * 100) / 100 : storedNet;
  const now = new Date();
  const earned = accruedWages(netPay, now);
  const liveAmount = store.advances
    .filter((a) => a.employee === user?.name && (a.status === "Pending" || a.status === "Approved" || a.status === "Paid Out"))
    .reduce((s, a) => s + a.amount, 0);
  const available = netPay ? Math.max(0, Math.round((earned * store.ewa.maxAccruedPct) / 100 - liveAmount)) : 0;

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

      {store.ewa.enabled && (
        <div className="glass-card card-pad" style={{ marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="merchant-ic" style={{ width: 46, height: 46, borderRadius: 14 }}>
              <Icon name="zap" size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{t("earlyPayTitle")}</div>
              <div style={{ fontSize: 12.5, color: "var(--ink-500)" }}>
                {netPay ? t("earlyPayAvailable", { amount: usd(available) }) : t("earlyPaySetup")}
              </div>
            </div>
          </div>
          <Link href="/employee/borrowing" className="btn btn-primary btn-sm">
            {t("earlyPayCta")}
          </Link>
        </div>
      )}

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
