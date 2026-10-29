"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";
import { useAppData } from "@/lib/AppDataContext";
import { buildPayslipDoc, openPayslipPdf, payslipTotals, usd, PayslipDoc } from "@/lib/payslip";

interface Payslip {
  period: string;
  payDate: string;
  status: string;
  doc: PayslipDoc;
}

const PAYSLIP_PERIODS: Omit<Payslip, "doc">[] = [
  { period: "August 2026", payDate: "Aug 25, 2026", status: "Paid" },
  { period: "September 2026", payDate: "Sep 25, 2026", status: "Paid" },
  { period: "October 2026", payDate: "Oct 25, 2026", status: "Pending" },
];

export default function EmployeePayslipsPage() {
  const { user, toast } = useAppData();
  const t = useTranslations("Pages.emp_payslips");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const statusLabel = (s: string) =>
    s === "Paid" ? t("statusPaid") : s === "Pending" ? t("statusPending") : s;

  const payslips = useMemo<Payslip[]>(
    () =>
      PAYSLIP_PERIODS.map((p) => ({
        ...p,
        doc: buildPayslipDoc({
          employee: user?.name ?? "Emma Wilson",
          period: p.period,
          company: user?.organisation ?? undefined,
        }),
      })),
    [user]
  );

  const filteredData = useMemo(() => {
    return payslips.filter((p) =>
      (!statusFilter || p.status === statusFilter) &&
      p.period.toLowerCase().includes(search.toLowerCase())
    );
  }, [payslips, search, statusFilter]);

  const handleDownload = (p: Payslip) => {
    openPayslipPdf(p.doc);
    toast(t("payslipOpenedToast", { period: p.period }), "download");
  };

  // Year-to-date summary across all payslips
  const ytd = useMemo(() => {
    return payslips.reduce(
      (acc, p) => {
        const totals = payslipTotals(p.doc);
        acc.gross += totals.gross;
        acc.deductions += totals.deductions;
        acc.net += totals.net;
        return acc;
      },
      { gross: 0, deductions: 0, net: 0 }
    );
  }, [payslips]);

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
          <div className="stat-label">{t("statYtdGross")}</div>
          <div className="stat-value">{usd(ytd.gross)}</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statYtdDeductions")}</div>
          <div className="stat-value" style={{ color: "var(--red)" }}>{usd(ytd.deductions)}</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statYtdNetPay")}</div>
          <div className="stat-value" style={{ color: "var(--green)" }}>{usd(ytd.net)}</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statPayslips")}</div>
          <div className="stat-value">{payslips.length}</div>
        </div>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder={t("searchPlaceholder")}
          statusOptions={[{ value: "Paid", label: t("statusPaid") }, { value: "Pending", label: t("statusPending") }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thPeriod")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thGross")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thDeductions")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thNetPay")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thPayDate")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thStatus")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thActions")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  {t("emptySearch")}
                </td>
              </tr>
            )}
            {filteredData.map((p, idx) => {
              const totals = payslipTotals(p.doc);
              return (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{p.period}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{usd(totals.gross)}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{usd(totals.deductions)}</td>
                <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 600 }}>{usd(totals.net)}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{p.payDate}</td>
                <td style={{ padding: "12px 8px" }}><span className={`badge ${p.status === "Paid" ? "badge-green" : "badge-amber"}`}>{statusLabel(p.status)}</span></td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleDownload(p)}><Icon name="download" size={14} style={{ marginRight: 4 }} />PDF</button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
