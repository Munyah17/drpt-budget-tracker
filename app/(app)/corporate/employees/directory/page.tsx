"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";
import RecordModal, { RowRecord } from "@/components/RecordModal";

interface Employee {
  name: string;
  email: string;
  department: string;
  role: string;
  status: string;
}

const EMPLOYEES_DATA: Employee[] = [];

export default function CorporateEmployeesDirectoryPage() {
  const t = useTranslations("Pages.corp_emp_directory");
  const { toast } = useAppData();
  const [employees, setEmployees] = useState<Employee[]>(EMPLOYEES_DATA);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState<{ mode: "view" | "edit" | "create"; record: RowRecord; index: number } | null>(null);

  const filteredData = useMemo(() => {
    return employees.filter((emp) =>
      (!statusFilter || emp.status === statusFilter) &&
      (emp.name.toLowerCase().includes(search.toLowerCase()) || emp.email.toLowerCase().includes(search.toLowerCase()) || emp.department.toLowerCase().includes(search.toLowerCase()))
    );
  }, [employees, search, statusFilter]);

  const openModal = (mode: "view" | "edit" | "create", emp?: Employee, index?: number) => {
    const record: RowRecord = emp
      ? { name: emp.name, email: emp.email, department: emp.department, role: emp.role, status: emp.status }
      : { name: "", email: "", department: "", role: "", status: "Active" };
    setModal({ mode, record, index: index ?? -1 });
  };

  const handleSave = (values: RowRecord) => {
    if (!modal) return;
    const emp: Employee = { name: values.name, email: values.email, department: values.department, role: values.role, status: values.status || "Active" };
    if (modal.mode === "create") {
      setEmployees((prev) => [...prev, emp]);
      toast(t("toastAdded", { name: emp.name }));
    } else {
      setEmployees((prev) => prev.map((e, i) => (i === modal.index ? emp : e)));
      toast(t("toastUpdated", { name: emp.name }));
    }
    setModal(null);
  };

  const handleDelete = () => {
    if (!modal) return;
    const name = modal.record.name;
    setEmployees((prev) => prev.filter((_, i) => i !== modal.index));
    toast(t("toastRemoved", { name }), "trash-2");
    setModal(null);
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal("create")}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          {t("addEmployee")}
        </button>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder={t("searchPlaceholder")}
          statusOptions={[{ value: "Active", label: t("statusActive") }, { value: "On Leave", label: t("statusOnLeave") }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colName")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colEmail")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colDepartment")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colRole")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colStatus")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colActions")}</th>
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
            {filteredData.map((emp, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{emp.name}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{emp.email}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{emp.department}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{emp.role}</td>
                <td style={{ padding: "12px 8px" }}><span className={`badge ${emp.status === "Active" ? "badge-green" : "badge-amber"}`}>{emp.status}</span></td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => openModal("view", emp, employees.indexOf(emp))}><Icon name="eye" size={14} style={{ marginRight: 4 }} />{t("view")}</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => openModal("edit", emp, employees.indexOf(emp))}><Icon name="edit" size={14} style={{ marginRight: 4 }} />{t("edit")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <RecordModal
          mode={modal.mode}
          title={modal.mode === "create" ? t("modalAdd") : modal.mode === "edit" ? t("modalEdit") : t("modalDetails")}
          record={modal.record}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={modal.mode === "view" ? handleDelete : undefined}
        />
      )}
    </>
  );
}
