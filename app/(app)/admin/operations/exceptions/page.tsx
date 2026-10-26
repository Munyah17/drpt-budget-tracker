"use client";

import { useState, useMemo } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

import { useCrud } from "@/lib/useCrud";
interface Exception {
  type: string;
  description: string;
  priority: string;
  assigned: string;
  status: string;
}

const EXCEPTIONS_DATA: Exception[] = [];

export default function AdminExceptionsPage() {
  const [search, setSearch] = useState("");
  const crud = useCrud(EXCEPTIONS_DATA, "Exception");
  const { toast } = useAppData();
  const [priorityFilter, setPriorityFilter] = useState("");

  const filteredData = useMemo(() => {
    return crud.items.filter((exception) =>
      (!priorityFilter || exception.priority === priorityFilter) &&
      (exception.type.toLowerCase().includes(search.toLowerCase()) || exception.description.toLowerCase().includes(search.toLowerCase()))
    );
  }, [crud.items, search, priorityFilter]);

  const handleResolve = (item: string) => {
    toast(`Resolving ${item}...`);
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Exceptions & Incidents</h2>
          <p className="section-sub">Track and resolve operational issues</p>
        </div>
        <button className="btn btn-primary" onClick={() => crud.openModal("create")}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          Report Exception
        </button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">Critical</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">High</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Medium</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Low</div>
          <div className="stat-value">—</div>
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
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => crud.openModal("view", exception, crud.items.indexOf(exception))}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleResolve(exception.type)}><Icon name="check" size={14} style={{ marginRight: 4 }} />Resolve</button>
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
