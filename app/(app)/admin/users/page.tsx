"use client";

import { useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { useCrud } from "@/lib/useCrud";
import Icon from "@/components/Icon";

interface User {
  id: string;
  name: string;
  email: string;
  status: "active" | "inactive" | "suspended";
  plan: "free" | "paid";
  joined: string;
  lastActive: string;
}

const USERS_DATA: User[] = [
  { id: "1", name: "John Doe", email: "john.doe@email.com", status: "active", plan: "paid", joined: "2025-01-15", lastActive: "2h ago" },
  { id: "2", name: "Sarah Smith", email: "sarah.smith@email.com", status: "active", plan: "paid", joined: "2025-02-20", lastActive: "5m ago" },
  { id: "3", name: "Mike Wilson", email: "mike.wilson@email.com", status: "suspended", plan: "free", joined: "2025-03-10", lastActive: "3d ago" },
  { id: "4", name: "Emma Jones", email: "emma.jones@email.com", status: "active", plan: "free", joined: "2025-04-05", lastActive: "1h ago" },
  { id: "5", name: "Tom Brown", email: "tom.brown@email.com", status: "inactive", plan: "free", joined: "2025-04-12", lastActive: "7d ago" },
];

export default function UserManagementPage() {
  const { toast } = useAppData();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "suspended">("all");
  const crud = useCrud(USERS_DATA, "User");

  const filteredUsers = crud.items.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const colors = {
      active: "badge-green",
      inactive: "badge-amber",
      suspended: "badge-red",
    };
    return <span className={`badge ${colors[status as keyof typeof colors]}`}>{status}</span>;
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">User Management</h2>
          <p className="section-sub">Manage all platform users</p>
        </div>
        <button className="btn btn-primary" onClick={() => crud.openModal("create")}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          Add User
        </button>
      </div>

      <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)" }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive" | "suspended")}
            style={{ padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)" }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>User</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Status</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Plan</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Joined</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Last Active</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px" }}>
                  <div style={{ fontWeight: 600 }}>{user.name}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-500)" }}>{user.email}</div>
                </td>
                <td style={{ padding: "12px 8px" }}>{getStatusBadge(user.status)}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${user.plan === "paid" ? "badge-green" : "badge-amber"}`}>
                    {user.plan}
                  </span>
                </td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{user.joined}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{user.lastActive}</td>
                <td style={{ padding: "12px 8px" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: "6px 10px" }}
                      onClick={() => crud.openModal("view", user, crud.items.indexOf(user))}
                    >
                      <Icon name="eye" size={16} />
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: "6px 10px" }}
                      onClick={() => crud.openModal("edit", user, crud.items.indexOf(user))}
                    >
                      <Icon name="edit-2" size={16} />
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: "6px 10px", color: user.status === "suspended" ? "var(--green)" : "var(--red)" }}
                      onClick={() => {
                        crud.setItems((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: u.status === "suspended" ? "active" : "suspended" } : u)));
                        toast(user.status === "suspended" ? `${user.name} reactivated` : `${user.name} suspended`, "x-circle");
                      }}
                    >
                      <Icon name="x-circle" size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-4">
        <div className="glass-card card-pad">
          <div className="stat-label">Total Users</div>
          <div className="stat-value">1,247</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Active Users</div>
          <div className="stat-value">892</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Paid Users</div>
          <div className="stat-value">456</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">Suspended</div>
          <div className="stat-value">23</div>
        </div>
      </div>
      {crud.modalNode}
    </>
  );
}
