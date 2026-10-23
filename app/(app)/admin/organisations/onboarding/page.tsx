"use client";

import { useState, useMemo } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

interface Onboarding {
  organisation: string;
  contact: string;
  stage: string;
  progress: string;
  assigned: string;
}

const ONBOARDING_DATA: Onboarding[] = [
  { organisation: "GlobalHealth Inc", contact: "hr@globalhealth.com", stage: "Integration Setup", progress: "60%", assigned: "John Smith" },
  { organisation: "StartupXYZ", contact: "admin@startupxyz.com", stage: "Contract Review", progress: "30%", assigned: "Sarah Jones" },
];

export default function AdminOnboardingPage() {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");

  const filteredData = useMemo(() => {
    return ONBOARDING_DATA.filter((item) =>
      (!stageFilter || item.stage === stageFilter) &&
      item.organisation.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, stageFilter]);

  const handleView = (item: string) => {
    alert(`Viewing ${item}...`);
  };

  const handleEdit = (item: string) => {
    alert(`Editing ${item}...`);
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Onboarding</h2>
          <p className="section-sub">Manage organisation onboarding process</p>
        </div>
        <button className="btn btn-primary">
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          Add Onboarding
        </button>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder="Search onboarding..."
          categoryOptions={[{ value: "Integration Setup", label: "Integration Setup" }, { value: "Contract Review", label: "Contract Review" }]}
          onSearchChange={setSearch}
          onCategoryChange={setStageFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Organisation</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Contact</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Stage</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Progress</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Assigned</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  No onboarding items match your search.
                </td>
              </tr>
            )}
            {filteredData.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{item.organisation}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{item.contact}</td>
                <td style={{ padding: "12px 8px" }}><span className={`badge ${item.stage === "Integration Setup" ? "badge-blue" : "badge-amber"}`}>{item.stage}</span></td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{item.progress}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{item.assigned}</td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleView(item.organisation)}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleEdit(item.organisation)}><Icon name="edit" size={14} style={{ marginRight: 4 }} />Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
