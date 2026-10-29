"use client";

import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import { downloadBlob } from "@/lib/download";

const REPORTS = [
  { key: "headcount", icon: "users" },
  { key: "payrollSummary", icon: "dollar-sign" },
  { key: "turnover", icon: "repeat" },
  { key: "benefitsUtilisation", icon: "heart-pulse" },
  { key: "compliance", icon: "shield" },
] as const;

export default function CorporateReportsPage() {
  const t = useTranslations("Pages.corp_reports");
  const { toast } = useAppData();

  const handleDownload = (key: string) => {
    const name = t(`reports.${key}.name`);
    downloadBlob(
      `${name.toLowerCase().replace(/\s+/g, "-")}.csv`,
      `"metric","value"\n"report","${name}"\n"generated","${new Date().toISOString()}"\n"employees","450"\n` ,
      "text/csv"
    );
    toast(t("toastGenerated", { name }), "file-down");
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
        {REPORTS.map((r) => (
          <div key={r.key} className="glass-card card-pad" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: "var(--pink-100)",
                color: "var(--rose-600)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <Icon name={r.icon} size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{t(`reports.${r.key}.name`)}</div>
                <div style={{ fontSize: 12, color: "var(--ink-500)" }}>{t(`reports.${r.key}.desc`)}</div>
              </div>
            </div>
            <button className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => handleDownload(r.key)}>
              <Icon name="download" size={14} style={{ marginRight: 4 }} />{t("generate")}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
