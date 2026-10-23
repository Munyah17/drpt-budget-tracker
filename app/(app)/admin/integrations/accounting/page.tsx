"use client";

import { useState, useMemo } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

interface AccountingIntegration {
  name: string;
  category: string;
  organisations: string;
  status: string;
  syncFrequency: string;
}

const ACCOUNTING_DATA: AccountingIntegration[] = [
  { name: "Xero", category: "Accounting", organisations: "45", status: "Connected", syncFrequency: "Real-time" },
  { name: "QuickBooks", category: "Accounting", organisations: "32", status: "Connected", syncFrequency: "Hourly" },
  { name: "Sage", category: "Accounting", organisations: "18", status: "Degraded", syncFrequency: "Daily" },
];

export default function AdminAccountingPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filteredData = useMemo(() => {
    return ACCOUNTING_DATA.filter((integration) =>
      (!statusFilter || integration.status === statusFilter) &&
      (integration.name.toLowerCase().includes(search.toLowerCase()) || integration.category.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search, statusFilter]);

  const handleSync = (item: string) => {
    alert(`Syncing ${item}...`);
  };

  const handleEdit = (item: string) => {
    alert(`Editing ${item}...`);
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Accounting Integrations</h2>
          <p className="section-sub">Manage accounting software connections</p>
        </div>
        <button className="btn btn-primary">
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          Add Integration
        </button>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder="Search integrations..."
          statusOptions={[{ value: "Connected", label: "Connected" }, { value: "Degraded", label: "Degraded" }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Software</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Category</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Organisations</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Sync Frequency</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  No integrations match your search.
                </td>
              </tr>
            )}
            {filteredData.map((integration, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{integration.name}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{integration.category}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{integration.organisations}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${integration.status === "Connected" ? "badge-green" : "badge-amber"}`}>
                    {integration.status}
                  </span>
                </td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{integration.syncFrequency}</td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleSync(integration.name)}><Icon name="refresh-cw" size={14} style={{ marginRight: 4 }} />Sync</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleEdit(integration.name)}><Icon name="edit" size={14} style={{ marginRight: 4 }} />Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
