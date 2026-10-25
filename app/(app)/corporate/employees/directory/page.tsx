"use client";

import { useState, useMemo } from "react";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

interface Employee {
  name: string;
  email: string;
  department: string;
  role: string;
  status: string;
}

const EMPLOYEES_DATA: Employee[] = [
  { name: "Emma Wilson", email: "emma.wilson@acme.com", department: "Engineering", role: "Senior Engineer", status: "Active" },
  { name: "David Brown", email: "david.brown@acme.com", department: "Sales", role: "Account Executive", status: "Active" },
  { name: "Lisa Chen", email: "lisa.chen@acme.com", department: "Operations", role: "Ops Coordinator", status: "Active" },
  { name: "James Patel", email: "james.patel@acme.com", department: "Finance", role: "Accountant", status: "On Leave" },
];

export default function CorporateEmployeesDirectoryPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filteredData = useMemo(() => {
    return EMPLOYEES_DATA.filter((emp) =>
      (!statusFilter || emp.status === statusFilter) &&
      (emp.name.toLowerCase().includes(search.toLowerCase()) || emp.email.toLowerCase().includes(search.toLowerCase()) || emp.department.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search, statusFilter]);

  const handleView = (item: string) => alert(`Viewing ${item}...`);
  const handleEdit = (item: string) => alert(`Editing ${item}...`);

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Employee Directory</h2>
          <p className="section-sub">All employees in your organisation</p>
        </div>
        <button className="btn btn-primary">
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          Add Employee
        </button>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder="Search employees..."
          statusOptions={[{ value: "Active", label: "Active" }, { value: "On Leave", label: "On Leave" }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Name</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Email</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Department</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Role</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  No employees match your search.
                </td>
              </tr>
            )}
            {filteredData.map((emp, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{emp.name}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{emp.email}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{emp.department}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{emp.role}</td>
                <td style={{ padding: "12px 8px" }}><span className={`badge ${emp.status === "Active" ? "badge-green" : "badge-amber"}`}>{emp.status}</span></td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleView(emp.name)}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleEdit(emp.name)}><Icon name="edit" size={14} style={{ marginRight: 4 }} />Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
