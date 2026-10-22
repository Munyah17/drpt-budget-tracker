"use client";

import { useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";

interface Staff {
  id: string;
  name: string;
  email: string;
  role: "admin" | "moderator" | "support";
  department: string;
  status: "active" | "on-leave" | "inactive";
}

export default function StaffManagementPage() {
  const { toast } = useAppData();
  const [searchTerm, setSearchTerm] = useState("");

  const mockStaff: Staff[] = [
    { id: "1", name: "Admin User", email: "munyamuzvidziwa19@gmail.com", role: "admin", department: "Management", status: "active" },
    { id: "2", name: "Jane Cooper", email: "jane.cooper@drpt.com", role: "moderator", department: "Support", status: "active" },
    { id: "3", name: "Robert Fox", email: "robert.fox@drpt.com", role: "support", department: "Support", status: "on-leave" },
    { id: "4", name: "Cody Fisher", email: "cody.fisher@drpt.com", role: "moderator", department: "Operations", status: "active" },
  ];

  const filteredStaff = mockStaff.filter(staff => 
    staff.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    staff.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: "badge-red",
      moderator: "badge-amber",
      support: "badge-green",
    };
    return <span className={`badge ${colors[role as keyof typeof colors]}`}>{role}</span>;
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Staff Management</h2>
          <p className="section-sub">Manage platform staff and permissions</p>
        </div>
        <button className="btn btn-primary">
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          Add Staff
        </button>
      </div>

      <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search staff..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)", marginBottom: 16 }}
        />

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Staff Member</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Role</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Department</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map((staff) => (
              <tr key={staff.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px" }}>
                  <div style={{ fontWeight: 600 }}>{staff.name}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-500)" }}>{staff.email}</div>
                </td>
                <td style={{ padding: "12px 8px" }}>{getRoleBadge(staff.role)}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{staff.department}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${staff.status === "active" ? "badge-green" : staff.status === "on-leave" ? "badge-amber" : "badge-red"}`}>
                    {staff.status}
                  </span>
                </td>
                <td style={{ padding: "12px 8px" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-ghost" style={{ padding: "6px 10px" }}>
                      <Icon name="edit-2" size={16} />
                    </button>
                    <button className="btn btn-ghost" style={{ padding: "6px 10px", color: "var(--red)" }}>
                      <Icon name="trash-2" size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-3">
        <div className="glass-card card-pad">
          <div className="stat-label">Total Staff</div>
          <div className="stat-value">12</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Active Now</div>
          <div className="stat-value">8</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">On Leave</div>
          <div className="stat-value">2</div>
        </div>
      </div>
    </>
  );
}
