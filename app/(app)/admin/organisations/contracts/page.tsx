"use client";

import { useState, useMemo } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

interface Contract {
  organisation: string;
  plan: string;
  monthlyFee: string;
  startDate: string;
  renewal: string;
  status: string;
}

const CONTRACTS_DATA: Contract[] = [
  { organisation: "Acme Corporation", plan: "Enterprise", monthlyFee: "$2,500", startDate: "2024-01-15", renewal: "2025-01-15", status: "Active" },
  { organisation: "TechCorp Ltd", plan: "Professional", monthlyFee: "$1,200", startDate: "2024-03-01", renewal: "2025-03-01", status: "Active" },
];

export default function AdminContractsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filteredData = useMemo(() => {
    return CONTRACTS_DATA.filter((contract) =>
      (!statusFilter || contract.status === statusFilter) &&
      contract.organisation.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, statusFilter]);

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Contracts</h2>
          <p className="section-sub">Manage organisation contracts</p>
        </div>
        <button className="btn btn-primary">
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          Add Contract
        </button>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder="Search contracts..."
          statusOptions={[{ value: "Active", label: "Active" }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Organisation</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Plan</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Monthly Fee</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Start Date</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Renewal</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  No contracts match your search.
                </td>
              </tr>
            )}
            {filteredData.map((contract, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{contract.organisation}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{contract.plan}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{contract.monthlyFee}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{contract.startDate}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{contract.renewal}</td>
                <td style={{ padding: "12px 8px" }}><span className="badge badge-green">{contract.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
