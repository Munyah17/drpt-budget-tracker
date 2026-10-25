"use client";

import { useState, useMemo } from "react";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

import { useCrud } from "@/lib/useCrud";
interface Employee {
  name: string;
  email: string;
  organisation: string;
  department: string;
  status: string;
}

const EMPLOYEES_DATA: Employee[] = [
  { name: "Emma Wilson", email: "emma.wilson@acme.com", organisation: "Acme Corporation", department: "Engineering", status: "Active" },
  { name: "David Brown", email: "david.brown@techcorp.com", organisation: "TechCorp Ltd", department: "Sales", status: "Active" },
];

export default function AdminEmployeesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const crud = useCrud(EMPLOYEES_DATA, "Employee");

  const filteredData = useMemo(() => {
    return crud.items.filter((employee) =>
      (!statusFilter || employee.status === statusFilter) &&
      (employee.name.toLowerCase().includes(search.toLowerCase()) || employee.email.toLowerCase().includes(search.toLowerCase()))
    );
  }, [crud.items, search, statusFilter]);

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Corporate Employees</h2>
          <p className="section-sub">Manage corporate employee accounts</p>
        </div>
        <button className="btn btn-primary" onClick={() => crud.openModal("create")}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          Add Employee
        </button>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder="Search employees..."
          statusOptions={[{ value: "Active", label: "Active" }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Name</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Email</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Organisation</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Department</th>
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
            {filteredData.map((employee, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{employee.name}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{employee.email}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{employee.organisation}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{employee.department}</td>
                <td style={{ padding: "12px 8px" }}><span className="badge badge-green">{employee.status}</span></td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => crud.openModal("view", employee, crud.items.indexOf(employee))}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => crud.openModal("edit", employee, crud.items.indexOf(employee))}><Icon name="edit" size={14} style={{ marginRight: 4 }} />Edit</button>
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
