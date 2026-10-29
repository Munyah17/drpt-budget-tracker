"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCrud } from "@/lib/useCrud";
import Icon from "@/components/Icon";

interface Staff {
  id: string;
  name: string;
  email: string;
  role: "admin" | "moderator" | "support";
  department: string;
  status: "active" | "on-leave" | "inactive";
}

const STAFF_DATA: Staff[] = [];

export default function StaffManagementPage() {
  const t = useTranslations("Pages.adm_staff");
  const [searchTerm, setSearchTerm] = useState("");
  const crud = useCrud(STAFF_DATA, t("entityName"));

  const filteredStaff = crud.items.filter(staff => 
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
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={() => crud.openModal("create")}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          {t("addStaff")}
        </button>
      </div>

      <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder={t("phSearch")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)", marginBottom: 16 }}
        />

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("entityName")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colRole")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colDepartment")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colStatus")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colActions")}</th>
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
                    <button className="btn btn-ghost" style={{ padding: "6px 10px" }} onClick={() => crud.openModal("edit", staff, crud.items.indexOf(staff))}>
                      <Icon name="edit-2" size={16} />
                    </button>
                    <button className="btn btn-ghost" style={{ padding: "6px 10px", color: "var(--red)" }} onClick={() => crud.openModal("view", staff, crud.items.indexOf(staff))}>
                      <Icon name="eye" size={16} />
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
          <div className="stat-label">{t("totalStaff")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("activeNow")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("onLeave")}</div>
          <div className="stat-value">—</div>
        </div>
      </div>
      {crud.modalNode}
    </>
  );
}
