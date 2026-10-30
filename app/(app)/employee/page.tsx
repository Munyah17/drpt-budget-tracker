"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useAppData } from "@/lib/AppDataContext";
import { useCorpStore } from "@/lib/corpStore";
import { accruedWages } from "@/lib/ewa";
import { usd } from "@/lib/payslip";
import { ukDate } from "@/lib/format";
import Icon from "@/components/Icon";

const NETPAY_KEY = "drpt-emp-netpay";

interface EmpNotice {
  id: string; title: string; body: string; category: string;
  pinned: boolean; acked: boolean; created_at: string;
}

function NoticeBoard({ employee }: { employee: string }) {
  const t = useTranslations("Pages.emp_home");
  const [notices, setNotices] = useState<EmpNotice[]>([]);

  useEffect(() => {
    fetch(`/api/hr/notices?employee=${encodeURIComponent(employee)}`)
      .then((r) => r.json()).then((rows) => setNotices(Array.isArray(rows) ? rows.slice(0, 4) : []))
      .catch(() => {});
  }, [employee]);

  async function ack(n: EmpNotice) {
    await fetch("/api/hr/notices/ack", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notice_id: n.id, employee_name: employee }),
    });
    setNotices((p) => p.map((x) => (x.id === n.id ? { ...x, acked: true } : x)));
  }

  if (!notices.length) return null;
  return (
    <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <Icon name="bell" size={18} style={{ color: "var(--rose-600)" }} />
        <h3 style={{ fontWeight: 600, fontSize: 15 }}>{t("noticesTitle")}</h3>
      </div>
      {notices.map((n) => (
        <div key={n.id} style={{ borderTop: "1px solid var(--card-border)", padding: "12px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            {n.pinned && <Icon name="pin" size={12} style={{ color: "var(--rose-600)" }} />}
            <b style={{ fontSize: 13.5 }}>{n.title}</b>
            <span className={`badge ${n.category === "Urgent" ? "badge-red" : n.category === "Policy" ? "badge-blue" : "badge-green"}`} style={{ fontSize: 10.5 }}>{n.category}</span>
            <span style={{ marginLeft: "auto", fontSize: 11.5, color: "var(--ink-500)" }}>{ukDate(n.created_at.slice(0, 10))}</span>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--ink-500)", margin: "0 0 8px", lineHeight: 1.55 }}>{n.body}</p>
          {!n.acked ? (
            <button className="btn btn-ghost btn-sm" style={{ fontSize: 12, color: "var(--rose-600)" }} onClick={() => ack(n)}>
              <Icon name="check-circle" size={13} style={{ marginRight: 5 }} />{t("ackBtn")}
            </button>
          ) : (
            <span style={{ fontSize: 12, color: "var(--green)", display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Icon name="check-circle" size={13} />{t("ackDone")}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

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

      <NoticeBoard employee={user?.name ?? ""} />

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
              <td style={{ padding: "10px 6px", fontSize: 13, color: "var(--ink-500)" }}>{t("labelSbu")}</td>
              <td style={{ padding: "10px 6px" }}>{store.sbus.find((s) => s.id === directoryMatch?.sbuId)?.name ?? store.sbus[0]?.name ?? "—"}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td style={{ padding: "10px 6px", fontSize: 13, color: "var(--ink-500)" }}>{t("labelDepartment")}</td>
              <td style={{ padding: "10px 6px" }}>{directoryMatch?.department ?? "—"}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td style={{ padding: "10px 6px", fontSize: 13, color: "var(--ink-500)" }}>{t("labelJobTitle")}</td>
              <td style={{ padding: "10px 6px" }}>{directoryMatch?.jobTitle ?? "—"}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td style={{ padding: "10px 6px", fontSize: 13, color: "var(--ink-500)" }}>{t("labelManager")}</td>
              <td style={{ padding: "10px 6px" }}>{directoryMatch?.manager ?? "—"}</td>
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
