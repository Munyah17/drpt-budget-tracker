"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { useCrud } from "@/lib/useCrud";
import { downloadCsv } from "@/lib/download";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

interface AuditLog {
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  ipAddress: string;
}

const AUDIT_DATA: AuditLog[] = [];

export default function AdminAuditPage() {
  const t = useTranslations("Pages.adm_risk_audit");
  const { toast } = useAppData();
  const [search, setSearch] = useState("");
  const crud = useCrud(AUDIT_DATA, t("entityName"));

  const filteredData = useMemo(() => {
    return crud.items.filter((log) =>
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.resource.toLowerCase().includes(search.toLowerCase())
    );
  }, [crud.items, search]);

  const exportLogs = () => {
    downloadCsv("risk-audit-logs.csv", filteredData.map((l) => ({ ...l })));
    toast(t("logsExported", { count: filteredData.length }), "download");
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={exportLogs}>
          <Icon name="download" size={16} style={{ marginRight: 8 }} />
          {t("exportLogs")}
        </button>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder={t("searchPlaceholder")}
          onSearchChange={setSearch}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thTimestamp")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thUser")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thAction")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thResource")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thIpAddress")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  {t("emptyState")}
                </td>
              </tr>
            )}
            {filteredData.map((log, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)", cursor: "pointer" }} onClick={() => crud.openModal("view", log, crud.items.indexOf(log))}>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{log.timestamp}</td>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{log.user}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{log.action}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{log.resource}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{log.ipAddress}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {crud.modalNode}
    </>
  );
}
