"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { adminHeaders } from "@/lib/adminClient";
import Icon from "@/components/Icon";
import { downloadBlob } from "@/lib/download";

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
}

export default function AdminReportsPage() {
  const t = useTranslations("Pages.adm_reports");
  const { toast, user } = useAppData();
  const [busy, setBusy] = useState<string | null>(null);

  async function fetchJson(url: string) {
    const res = await fetch(url, { headers: await adminHeaders(user?.email) });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
    return data;
  }

  async function handleGenerateReport(kind: string, reportName: string) {
    setBusy(kind);
    try {
      if (kind === "revenue" || kind === "transactions") {
        const data = await fetchJson("/api/admin/payments");
        const payments = data?.payments ?? [];
        const csv = toCsv(
          ["id", "reference", "customer_email", "provider", "method", "amount", "currency", "status", "paid_at"],
          payments.map((p: Record<string, unknown>) => [
            p.id, p.reference, p.user_email, p.provider, p.method, p.amount, p.currency, p.status, p.paid_at,
          ])
        );
        downloadBlob("payments-report.csv", csv, "text/csv");
      } else if (kind === "users" || kind === "growth") {
        const data = await fetchJson("/api/admin/users");
        const users = data?.users ?? [];
        const csv = toCsv(
          ["id", "name", "email", "role", "is_paid", "paid_until", "payment_provider", "payment_amount", "payment_currency", "payment_reference", "payment_paid_at", "created_at"],
          users.map((u: Record<string, unknown>) => {
            const pay = u.payment as Record<string, unknown> | null;
            return [
              u.id, u.name, u.email, u.role, u.is_paid, u.paid_until,
              pay?.provider ?? "", pay?.amount ?? "", pay?.currency ?? "", pay?.reference ?? "", pay?.paid_at ?? "",
              u.created_at,
            ];
          })
        );
        downloadBlob("users-report.csv", csv, "text/csv");
      } else {
        // Fallback: summary CSV from whatever data is available
        const [payments, users] = await Promise.all([
          fetchJson("/api/admin/payments").catch(() => ({ payments: [] })),
          fetchJson("/api/admin/users").catch(() => ({ users: [] })),
        ]);
        const pays = payments?.payments ?? [];
        const usrs = users?.users ?? [];
        const paid = pays.filter((p: { status: string }) => p.status === "paid");
        const csv = toCsv(
          ["metric", "value"],
          [
            ["report", reportName],
            ["generated", new Date().toISOString()],
            ["total_users", usrs.length],
            ["paid_users", usrs.filter((u: { is_paid: boolean }) => u.is_paid).length],
            ["total_payments", pays.length],
            ["paid_payments", paid.length],
            ["revenue_total", paid.reduce((s: number, p: { amount: number | null }) => s + (p.amount ?? 0), 0)],
          ]
        );
        downloadBlob(`${reportName.toLowerCase().replace(/\s+/g, "-")}.csv`, csv, "text/csv");
      }
      toast(t("reportGenerated", { name: reportName }), "file-down");
    } catch (e) {
      toast(e instanceof Error ? e.message : t("reportFailed"), "x");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
      </div>

      <div className="grid grid-2">
        {[
          { kind: "users", name: t("reportUserActivityName"), desc: t("reportUserActivityDesc"), icon: "users" },
          { kind: "revenue", name: t("reportRevenueName"), desc: t("reportRevenueDesc"), icon: "dollar-sign" },
          { kind: "transactions", name: t("reportTransactionName"), desc: t("reportTransactionDesc"), icon: "list" },
          { kind: "summary", name: t("reportCategoryAnalysisName"), desc: t("reportCategoryAnalysisDesc"), icon: "pie-chart" },
          { kind: "growth", name: t("reportGrowthName"), desc: t("reportGrowthDesc"), icon: "trending-up" },
          { kind: "summary", name: t("reportSystemPerformanceName"), desc: t("reportSystemPerformanceDesc"), icon: "activity" },
        ].map((report) => (
          <div key={report.name} className="glass-card card-pad">
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: "var(--radius-sm)", background: "var(--pink-100)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={report.icon} size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{report.name}</div>
                <div style={{ fontSize: 13, color: "var(--ink-500)" }}>{report.desc}</div>
              </div>
            </div>
            <button
              className="btn btn-ghost"
              style={{ width: "100%" }}
              disabled={busy !== null}
              onClick={() => handleGenerateReport(report.kind, report.name)}
            >
              {busy === report.kind ? t("generating") : t("generateReport")}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
