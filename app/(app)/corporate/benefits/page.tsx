"use client";

import { useState, useMemo } from "react";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

interface Benefit {
  name: string;
  provider: string;
  enrolled: string;
  cost: string;
  status: string;
}

const BENEFITS_DATA: Benefit[] = [
  { name: "Health Insurance", provider: "Vitality Health", enrolled: "412", cost: "£18,500/mo", status: "Active" },
  { name: "Pension Scheme", provider: "Nest Pensions", enrolled: "445", cost: "£62,400/mo", status: "Active" },
  { name: "Life Insurance", provider: "Aviva", enrolled: "380", cost: "£4,200/mo", status: "Active" },
  { name: "Dental Cover", provider: "Bupa", enrolled: "210", cost: "£3,150/mo", status: "Review" },
];

export default function CorporateBenefitsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filteredData = useMemo(() => {
    return BENEFITS_DATA.filter((b) =>
      (!statusFilter || b.status === statusFilter) &&
      (b.name.toLowerCase().includes(search.toLowerCase()) || b.provider.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search, statusFilter]);

  const handleEdit = (item: string) => alert(`Editing ${item}...`);

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Employee Benefits</h2>
          <p className="section-sub">Manage benefit schemes and enrolment</p>
        </div>
        <button className="btn btn-primary">
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          Add Benefit
        </button>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder="Search benefits..."
          statusOptions={[{ value: "Active", label: "Active" }, { value: "Review", label: "Review" }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Benefit</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Provider</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Enrolled</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Monthly Cost</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  No benefits match your search.
                </td>
              </tr>
            )}
            {filteredData.map((b, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{b.name}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{b.provider}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{b.enrolled}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{b.cost}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${b.status === "Active" ? "badge-green" : "badge-amber"}`}>
                    {b.status}
                  </span>
                </td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleEdit(b.name)}><Icon name="edit" size={14} style={{ marginRight: 4 }} />Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
