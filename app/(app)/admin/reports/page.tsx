"use client";

import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import { downloadBlob } from "@/lib/download";

export default function AdminReportsPage() {
  const t = useTranslations("Pages.adm_reports");
  const { toast } = useAppData();

  const handleGenerateReport = (reportName: string) => {
    downloadBlob(
      `${reportName.toLowerCase().replace(/\s+/g, "-")}.csv`,
      `"metric","value"\n"report","${reportName}"\n"generated","${new Date().toISOString()}"\n"total_users","1247"\n`,
      "text/csv"
    );
    toast(t("reportGenerated", { name: reportName }), "file-down");
  };

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
          { name: t("reportUserActivityName"), desc: t("reportUserActivityDesc"), icon: "users" },
          { name: t("reportRevenueName"), desc: t("reportRevenueDesc"), icon: "dollar-sign" },
          { name: t("reportTransactionName"), desc: t("reportTransactionDesc"), icon: "list" },
          { name: t("reportCategoryAnalysisName"), desc: t("reportCategoryAnalysisDesc"), icon: "pie-chart" },
          { name: t("reportGrowthName"), desc: t("reportGrowthDesc"), icon: "trending-up" },
          { name: t("reportSystemPerformanceName"), desc: t("reportSystemPerformanceDesc"), icon: "activity" },
        ].map((report, idx) => (
          <div key={idx} className="glass-card card-pad" style={{ cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: "var(--radius-sm)", background: "var(--pink-100)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={report.icon} size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{report.name}</div>
                <div style={{ fontSize: 13, color: "var(--ink-500)" }}>{report.desc}</div>
              </div>
            </div>
            <button className="btn btn-ghost" style={{ width: "100%" }} onClick={() => handleGenerateReport(report.name)}>
              {t("generateReport")}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
