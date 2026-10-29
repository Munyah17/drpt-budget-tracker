"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import { downloadCsv } from "@/lib/download";

interface AuditLog {
  id: string;
  action: string;
  user: string;
  details: string;
  timestamp: string;
  ip: string;
}

export default function AuditLogsPage() {
  const t = useTranslations("Pages.adm_audit_logs");
  const { toast } = useAppData();
  const [searchTerm, setSearchTerm] = useState("");

  const mockLogs: AuditLog[] = [];

  const filteredLogs = mockLogs.filter(log =>
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionBadge = (action: string) => {
    if (action.includes("Login")) return <span className="badge badge-green">{t("actionLogin")}</span>;
    if (action.includes("Created")) return <span className="badge badge-blue">{t("actionCreate")}</span>;
    if (action.includes("Updated")) return <span className="badge badge-amber">{t("actionUpdate")}</span>;
    if (action.includes("Payment")) return <span className="badge badge-green">{t("actionPayment")}</span>;
    if (action.includes("Failed")) return <span className="badge badge-red">{t("actionError")}</span>;
    return <span className="badge badge-amber">{t("actionOther")}</span>;
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <button className="btn btn-ghost" onClick={() => {
          downloadCsv("audit-logs.csv", filteredLogs.map((l) => ({ timestamp: l.timestamp, action: l.action, user: l.user, details: l.details, ip: l.ip })));
          toast(t("logsExported", { count: filteredLogs.length }), "download");
        }}>
          <Icon name="download" size={16} style={{ marginRight: 8 }} />
          {t("exportLogs")}
        </button>
      </div>

      <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)" }}
        />
      </div>

      <div className="glass-card card-pad">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colTimestamp")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colAction")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colUser")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colDetails")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colIp")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{log.timestamp}</td>
                <td style={{ padding: "12px 8px" }}>{getActionBadge(log.action)}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{log.user}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{log.details}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
