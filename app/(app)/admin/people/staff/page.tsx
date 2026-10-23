"use client";

import { useState, useMemo } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

interface Staff {
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
}

const STAFF_DATA: Staff[] = [
  { name: "John Smith", email: "john.smith@drpt.com", role: "Operations Manager", department: "Operations", status: "Active" },
  { name: "Sarah Jones", email: "sarah.jones@drpt.com", role: "Finance Officer", department: "Finance", status: "Active" },
  { name: "Mike Davis", email: "mike.davis@drpt.com", role: "Support Admin", department: "Support", status: "Active" },
];

export default function AdminStaffPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filteredData = useMemo(() => {
    return STAFF_DATA.filter((staff) =>
      (!statusFilter || staff.status === statusFilter) &&
      (staff.name.toLowerCase().includes(search.toLowerCase()) || staff.email.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search, statusFilter]);

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
          <h2 className="section-title">Internal Staff</h2>
          <p className="section-sub">Manage internal staff accounts</p>
        </div>
        <button className="btn btn-primary">
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          Add Staff
        </button>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder="Search staff..."
          statusOptions={[{ value: "Active", label: "Active" }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Name</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Email</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Role</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Department</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  No staff match your search.
                </td>
              </tr>
            )}
            {filteredData.map((staff, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{staff.name}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{staff.email}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{staff.role}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{staff.department}</td>
                <td style={{ padding: "12px 8px" }}><span className="badge badge-green">{staff.status}</span></td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleView(staff.name)}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleEdit(staff.name)}><Icon name="edit" size={14} style={{ marginRight: 4 }} />Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
