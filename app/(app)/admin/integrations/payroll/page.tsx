"use client";

import { useState, useMemo } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

import { useCrud } from "@/lib/useCrud";
interface PayrollProvider {
  name: string;
  type: string;
  clients: string;
  status: string;
  integration: string;
}

const PAYROLL_DATA: PayrollProvider[] = [
  { name: "Gusto", type: "Payroll", clients: "12", status: "Active", integration: "Connected" },
  { name: "ADP", type: "Payroll", clients: "8", status: "Active", integration: "Connected" },
  { name: "QuickBooks Payroll", type: "Payroll", clients: "15", status: "Inactive", integration: "Pending" },
];

export default function AdminPayrollProvidersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const crud = useCrud(PAYROLL_DATA, "Integration");

  const { toast } = useAppData();
  const filteredData = useMemo(() => {
    return crud.items.filter((provider) =>
      (!statusFilter || provider.status === statusFilter) &&
      (provider.name.toLowerCase().includes(search.toLowerCase()) || provider.type.toLowerCase().includes(search.toLowerCase()))
    );
  }, [crud.items, search, statusFilter]);

  const handleSync = (item: string) => {
    toast(`Syncing ${item}...`);
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Payroll Providers</h2>
          <p className="section-sub">Manage payroll system integrations</p>
        </div>
        <button className="btn btn-primary" onClick={() => crud.openModal("create")}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          Add Provider
        </button>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder="Search providers..."
          statusOptions={[{ value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Provider</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Type</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Clients</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Integration</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  No providers match your search.
                </td>
              </tr>
            )}
            {filteredData.map((provider, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{provider.name}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{provider.type}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{provider.clients}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${provider.status === "Active" ? "badge-green" : "badge-amber"}`}>
                    {provider.status}
                  </span>
                </td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${provider.integration === "Connected" ? "badge-green" : "badge-amber"}`}>
                    {provider.integration}
                  </span>
                </td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleSync(provider.name)}><Icon name="refresh-cw" size={14} style={{ marginRight: 4 }} />Sync</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => crud.openModal("edit", provider, crud.items.indexOf(provider))}><Icon name="edit" size={14} style={{ marginRight: 4 }} />Edit</button>
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
