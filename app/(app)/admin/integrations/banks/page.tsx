"use client";

import { useState, useMemo } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

interface BankIntegration {
  name: string;
  provider: string;
  accounts: string;
  status: string;
  lastSync: string;
}

const BANKS_DATA: BankIntegration[] = [
  { name: "Barclays Business", provider: "TrueLayer", accounts: "3", status: "Connected", lastSync: "2 hours ago" },
  { name: "HSBC Corporate", provider: "TrueLayer", accounts: "2", status: "Connected", lastSync: "5 hours ago" },
  { name: "Lloyds Business", provider: "Yodlee", accounts: "1", status: "Degraded", lastSync: "3 days ago" },
];

export default function AdminBanksPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filteredData = useMemo(() => {
    return BANKS_DATA.filter((bank) =>
      (!statusFilter || bank.status === statusFilter) &&
      (bank.name.toLowerCase().includes(search.toLowerCase()) || bank.provider.toLowerCase().includes(search.toLowerCase()))
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
          <h2 className="section-title">Bank Connections</h2>
          <p className="section-sub">Manage bank account integrations</p>
        </div>
        <button className="btn btn-primary">
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          Add Bank
        </button>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder="Search banks..."
          statusOptions={[{ value: "Connected", label: "Connected" }, { value: "Degraded", label: "Degraded" }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Bank</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Provider</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Accounts</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Last Sync</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  No banks match your search.
                </td>
              </tr>
            )}
            {filteredData.map((bank, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{bank.name}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{bank.provider}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{bank.accounts}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${bank.status === "Connected" ? "badge-green" : "badge-amber"}`}>
                    {bank.status}
                  </span>
                </td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{bank.lastSync}</td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleSync(bank.name)}><Icon name="refresh-cw" size={14} style={{ marginRight: 4 }} />Sync</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleEdit(bank.name)}><Icon name="edit" size={14} style={{ marginRight: 4 }} />Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
