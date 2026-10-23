"use client";

import { useState, useMemo } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

interface AccessRole {
  role: string;
  permissions: string;
  users: string;
}

const ACCESS_DATA: AccessRole[] = [
  { role: "Super Admin", permissions: "Full platform access", users: "2" },
  { role: "Operations Manager", permissions: "Payroll, exceptions, reconciliation", users: "5" },
  { role: "Finance Officer", permissions: "Invoices, payments, reconciliation", users: "3" },
  { role: "Corporate Admin", permissions: "Organisation management, employees", users: "12" },
];

export default function AdminAccessPage() {
  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
    return ACCESS_DATA.filter((role) =>
      role.role.toLowerCase().includes(search.toLowerCase()) ||
      role.permissions.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const handleEdit = (item: string) => {
    alert(`Editing ${item}...`);
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Access Control</h2>
          <p className="section-sub">Manage roles and permissions</p>
        </div>
        <button className="btn btn-primary">
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          Add Role
        </button>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder="Search roles..."
          onSearchChange={setSearch}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Role</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Permissions</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Users</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  No roles match your search.
                </td>
              </tr>
            )}
            {filteredData.map((role, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{role.role}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{role.permissions}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{role.users}</td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleEdit(role.role)}><Icon name="edit" size={14} style={{ marginRight: 4 }} />Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
