"use client";

import { useState, useMemo } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

interface Incident {
  incidentId: string;
  type: string;
  severity: string;
  status: string;
  assigned: string;
}

const INCIDENTS_DATA: Incident[] = [
  { incidentId: "INC-2025-0526-001", type: "Unusual login activity", severity: "Critical", status: "Investigating", assigned: "Security Team" },
  { incidentId: "INC-2025-0525-001", type: "API rate limit exceeded", severity: "High", status: "Open", assigned: "Tech Team" },
  { incidentId: "INC-2025-0524-001", type: "Failed webhook delivery", severity: "Medium", status: "Resolved", assigned: "Ops Team" },
];

export default function AdminIncidentsPage() {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filteredData = useMemo(() => {
    return INCIDENTS_DATA.filter((incident) =>
      (!severityFilter || incident.severity === severityFilter) &&
      (!statusFilter || incident.status === statusFilter) &&
      (incident.incidentId.toLowerCase().includes(search.toLowerCase()) || incident.type.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search, severityFilter, statusFilter]);

  const handleView = (item: string) => {
    alert(`Viewing ${item}...`);
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Security Incidents</h2>
          <p className="section-sub">Track and manage security incidents</p>
        </div>
        <button className="btn btn-primary">
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          Report Incident
        </button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">Open</div>
          <div className="stat-value">3</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Investigating</div>
          <div className="stat-value">2</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Resolved (7d)</div>
          <div className="stat-value">8</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Critical</div>
          <div className="stat-value">1</div>
        </div>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder="Search incidents..."
          categoryOptions={[{ value: "Critical", label: "Critical" }, { value: "High", label: "High" }, { value: "Medium", label: "Medium" }, { value: "Low", label: "Low" }]}
          statusOptions={[{ value: "Open", label: "Open" }, { value: "Investigating", label: "Investigating" }, { value: "Resolved", label: "Resolved" }]}
          onSearchChange={setSearch}
          onCategoryChange={setSeverityFilter}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Incident ID</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Type</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Severity</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Assigned</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  No incidents match your search.
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
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleView(incident.incidentId)}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
