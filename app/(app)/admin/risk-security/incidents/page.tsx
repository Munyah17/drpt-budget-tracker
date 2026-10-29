"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

import { useCrud } from "@/lib/useCrud";
interface Incident {
  incidentId: string;
  type: string;
  severity: string;
  status: string;
  assigned: string;
}

const INCIDENTS_DATA: Incident[] = [];

export default function AdminIncidentsPage() {
  const t = useTranslations("Pages.adm_risk_incidents");
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const crud = useCrud(INCIDENTS_DATA, t("entityName"));

  const filteredData = useMemo(() => {
    return crud.items.filter((incident) =>
      (!severityFilter || incident.severity === severityFilter) &&
      (!statusFilter || incident.status === statusFilter) &&
      (incident.incidentId.toLowerCase().includes(search.toLowerCase()) || incident.type.toLowerCase().includes(search.toLowerCase()))
    );
  }, [crud.items, search, severityFilter, statusFilter]);

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={() => crud.openModal("create")}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          {t("reportIncident")}
        </button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statOpen")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statInvestigating")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statResolved7d")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statCritical")}</div>
          <div className="stat-value">—</div>
        </div>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder={t("searchPlaceholder")}
          categoryOptions={[{ value: "Critical", label: t("severityCritical") }, { value: "High", label: t("severityHigh") }, { value: "Medium", label: t("severityMedium") }, { value: "Low", label: t("severityLow") }]}
          statusOptions={[{ value: "Open", label: t("statusOpen") }, { value: "Investigating", label: t("statusInvestigating") }, { value: "Resolved", label: t("statusResolved") }]}
          onSearchChange={setSearch}
          onCategoryChange={setSeverityFilter}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thIncidentId")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thType")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thSeverity")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thStatus")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thAssigned")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thActions")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  {t("emptyState")}
                </td>
              </tr>
            )}
            {filteredData.map((incident, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{incident.incidentId}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{incident.type}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${incident.severity === "Critical" ? "badge-red" : incident.severity === "High" ? "badge-amber" : "badge-blue"}`}>
                    {incident.severity}
                  </span>
                </td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${incident.status === "Investigating" ? "badge-amber" : incident.status === "Open" ? "badge-blue" : "badge-green"}`}>
                    {incident.status}
                  </span>
                </td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{incident.assigned}</td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => crud.openModal("view", incident, crud.items.indexOf(incident))}><Icon name="eye" size={14} style={{ marginRight: 4 }} />{t("view")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {crud.modalNode}
    </>
  );
}
