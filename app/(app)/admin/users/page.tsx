"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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

const USERS_DATA: User[] = [];

export default function UserManagementPage() {
  const t = useTranslations("Pages.adm_users");
  const { toast } = useAppData();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "suspended">("all");
  const crud = useCrud(USERS_DATA, t("entityName"));

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
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={() => crud.openModal("create")}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          {t("addUser")}
        </button>
      </div>

      <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              placeholder={t("phSearch")}
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
            <option value="all">{t("optAllStatus")}</option>
            <option value="active">{t("optActive")}</option>
            <option value="inactive">{t("optInactive")}</option>
            <option value="suspended">{t("suspended")}</option>
          </select>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("entityName")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colStatus")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colPlan")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colJoined")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colLastActive")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colActions")}</th>
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
                        toast(user.status === "suspended" ? t("toastReactivated", { name: user.name }) : t("toastSuspended", { name: user.name }), "x-circle");
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
          <div className="stat-label">{t("totalUsers")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("activeUsers")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("paidUsers")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("suspended")}</div>
          <div className="stat-value">—</div>
        </div>
      </div>
      {crud.modalNode}
    </>
  );
}
