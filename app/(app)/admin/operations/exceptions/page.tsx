"use client";

import { useState, useMemo } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

interface Exception {
  type: string;
  description: string;
  priority: string;
  assigned: string;
  status: string;
}

const EXCEPTIONS_DATA: Exception[] = [
  { type: "Integration Failure", description: "GlobalHealth payroll sync timeout", priority: "Critical", assigned: "John Smith", status: "In Progress" },
  { type: "Data Mismatch", description: "Acme Corp employee record duplicate", priority: "High", assigned: "Sarah Jones", status: "Assigned" },
];

export default function AdminExceptionsPage() {
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const filteredData = useMemo(() => {
    return EXCEPTIONS_DATA.filter((exception) =>
      (!priorityFilter || exception.priority === priorityFilter) &&
      (exception.type.toLowerCase().includes(search.toLowerCase()) || exception.description.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search, priorityFilter]);

  const handleView = (item: string) => {
    alert(`Viewing ${item}...`);
  };

  const handleResolve = (item: string) => {
    alert(`Resolving ${item}...`);
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Exceptions & Incidents</h2>
          <p className="section-sub">Track and resolve operational issues</p>
        </div>
        <button className="btn btn-primary">
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          Report Exception
        </button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">Critical</div>
          <div className="stat-value">2</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">High</div>
          <div className="stat-value">5</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Medium</div>
          <div className="stat-value">8</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Low</div>
          <div className="stat-value">12</div>
        </div>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder="Search exceptions..."
          categoryOptions={[{ value: "Critical", label: "Critical" }, { value: "High", label: "High" }, { value: "Medium", label: "Medium" }, { value: "Low", label: "Low" }]}
          onSearchChange={setSearch}
          onCategoryChange={setPriorityFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Type</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Description</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Priority</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Assigned</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  No exceptions match your search.
                </td>
              </tr>
            )}
            {filteredData.map((exception, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{exception.type}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{exception.description}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${exception.priority === "Critical" ? "badge-red" : exception.priority === "High" ? "badge-amber" : "badge-blue"}`}>
                    {exception.priority}
                  </span>
                </td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{exception.assigned}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${exception.status === "In Progress" ? "badge-amber" : "badge-blue"}`}>
                    {exception.status}
                  </span>
                </td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleView(exception.type)}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleResolve(exception.type)}><Icon name="check" size={14} style={{ marginRight: 4 }} />Resolve</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
