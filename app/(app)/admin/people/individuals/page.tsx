"use client";

import { useState, useMemo } from "react";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

interface Person {
  name: string;
  email: string;
  plan: string;
  expiry: string;
  status: string;
}

const INDIVIDUALS_DATA: Person[] = [
  { name: "John Doe", email: "john.doe@email.com", plan: "Individual ($1/yr)", expiry: "2025-12-31", status: "Active" },
  { name: "Sarah Smith", email: "sarah.smith@email.com", plan: "Individual ($1/yr)", expiry: "2025-05-15", status: "Expired" },
  { name: "Mike Johnson", email: "mike.j@email.com", plan: "Individual ($1/yr)", expiry: "2026-01-20", status: "Active" },
];

export default function AdminIndividualsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const handleView = (item: string) => {
    alert(`Viewing ${item}...`);
  };

  const handleEdit = (item: string) => {
    alert(`Editing ${item}...`);
  };

  const filteredData = useMemo(() => {
    return INDIVIDUALS_DATA.filter((person) =>
      (!statusFilter || person.status === statusFilter) &&
      (person.name.toLowerCase().includes(search.toLowerCase()) || person.email.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search, statusFilter]);

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Individual Clients</h2>
          <p className="section-sub">Manage individual client accounts</p>
        </div>
        <button className="btn btn-primary">
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          Add Person
        </button>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder="Search people..."
          statusOptions={[{ value: "Active", label: "Active" }, { value: "Expired", label: "Expired" }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Name</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Email</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Plan</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Expiry</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  No people match your search.
                </td>
              </tr>
            )}
            {filteredData.map((person, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{person.name}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{person.email}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{person.plan}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{person.expiry}</td>
                <td style={{ padding: "12px 8px" }}><span className={`badge ${person.status === "Active" ? "badge-green" : "badge-red"}`}>{person.status}</span></td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleView(person.name)}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleEdit(person.name)}><Icon name="edit" size={14} style={{ marginRight: 4 }} />Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
