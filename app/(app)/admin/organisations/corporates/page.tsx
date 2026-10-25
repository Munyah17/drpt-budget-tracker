"use client";

import { useState, useMemo } from "react";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

import { useCrud } from "@/lib/useCrud";
interface Organisation {
  name: string;
  employees: string;
  status: string;
  plan: string;
  integration: string;
}

const CORPORATES_DATA: Organisation[] = [
  { name: "Acme Corporation", employees: "450", status: "Active", plan: "Enterprise", integration: "Connected" },
  { name: "TechCorp Ltd", employees: "320", status: "Active", plan: "Professional", integration: "Degraded" },
  { name: "GlobalHealth Inc", employees: "477", status: "Onboarding", plan: "Enterprise", integration: "Pending" },
];

export default function AdminCorporatesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const crud = useCrud(CORPORATES_DATA, "Corporate");

  const filteredData = useMemo(() => {
    return crud.items.filter((org) =>
      (!statusFilter || org.status === statusFilter) &&
      org.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [crud.items, search, statusFilter]);

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Corporate Clients</h2>
          <p className="section-sub">Manage corporate client organisations</p>
        </div>
        <button className="btn btn-primary" onClick={() => crud.openModal("create")}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          Add Organisation
        </button>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder="Search organisations..."
          statusOptions={[{ value: "Active", label: "Active" }, { value: "Onboarding", label: "Onboarding" }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Organisation</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Employees</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Plan</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Integration</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  No organisations match your search.
                </td>
              </tr>
            )}
            {filteredData.map((org, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{org.name}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{org.employees}</td>
                <td style={{ padding: "12px 8px" }}><span className={`badge ${org.status === "Active" ? "badge-green" : "badge-blue"}`}>{org.status}</span></td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{org.plan}</td>
                <td style={{ padding: "12px 8px" }}><span className={`badge ${org.integration === "Connected" ? "badge-green" : "badge-amber"}`}>{org.integration}</span></td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => crud.openModal("view", org, crud.items.indexOf(org))}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => crud.openModal("edit", org, crud.items.indexOf(org))}><Icon name="edit" size={14} style={{ marginRight: 4 }} />Edit</button>
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
