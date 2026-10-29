"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

import { useCrud } from "@/lib/useCrud";
interface Staff {
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
}

const STAFF_DATA: Staff[] = [];

export default function AdminStaffPage() {
  const t = useTranslations("Pages.adm_people_staff");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const crud = useCrud(STAFF_DATA, t("entityName"));

  const filteredData = useMemo(() => {
    return crud.items.filter((staff) =>
      (!statusFilter || staff.status === statusFilter) &&
      (staff.name.toLowerCase().includes(search.toLowerCase()) || staff.email.toLowerCase().includes(search.toLowerCase()))
    );
  }, [crud.items, search, statusFilter]);

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

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder={t("searchPlaceholder")}
          statusOptions={[{ value: "Active", label: t("statusActive") }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thName")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thEmail")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thRole")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thDepartment")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thStatus")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thActions")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  {t("emptyState")}
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
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => crud.openModal("view", staff, crud.items.indexOf(staff))}><Icon name="eye" size={14} style={{ marginRight: 4 }} />{t("view")}</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => crud.openModal("edit", staff, crud.items.indexOf(staff))}><Icon name="edit" size={14} style={{ marginRight: 4 }} />{t("edit")}</button>
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
