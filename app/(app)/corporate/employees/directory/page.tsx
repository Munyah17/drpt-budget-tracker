"use client";

import { useState, useMemo, FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";
import Modal from "@/components/Modal";
import RecordModal from "@/components/RecordModal";
import { useCorpStore, updateCorp, nextId, CorpEmployee } from "@/lib/corpStore";
import { usd } from "@/lib/payslip";

const th = { padding: "12px 8px", fontWeight: 600, fontSize: 13 } as const;
const td = { padding: "12px 8px", fontSize: 13 } as const;

function SbuModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("Pages.corp_emp_directory");
  const { toast } = useAppData();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    updateCorp((s) => ({
      ...s,
      sbus: [...s.sbus, { id: nextId("SBU"), name, code: code.toUpperCase() || name.slice(0, 3).toUpperCase() }],
    }));
    toast(t("toastSbuAdded", { name }), "check-circle");
    onClose();
  }

  return (
    <Modal title={t("sbuModalTitle")} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field"><label>{t("sbuName")}</label><input required value={name} onChange={(e) => setName(e.target.value)} placeholder={t("sbuNamePh")} /></div>
        <div className="field"><label>{t("sbuCode")}</label><input required value={code} onChange={(e) => setCode(e.target.value)} placeholder={t("sbuCodePh")} maxLength={6} /></div>
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit">{t("sbuAdd")}</button>
      </form>
    </Modal>
  );
}

function EmployeeModal({
  mode, emp, index, sbus, onSave, onDelete, onClose,
}: {
  mode: "view" | "edit" | "create";
  emp: CorpEmployee | null;
  index: number;
  sbus: { id: string; name: string; code: string }[];
  onSave: (e: CorpEmployee, index: number) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("Pages.corp_emp_directory");
  const [f, setF] = useState<CorpEmployee>(emp ?? {
    id: nextId("EMP"), name: "", email: "", department: "", jobTitle: "",
    grossPay: 0, bankName: "", bankAccount: "", sbuId: "sbu-hq", manager: "",
  });
  const set = (k: keyof CorpEmployee, v: string | number) => setF((p) => ({ ...p, [k]: v }));

  if (mode === "view" && emp) {
    return (
      <RecordModal
        mode="view"
        title={t("modalDetails")}
        record={{
          [t("colName")]: emp.name, [t("colEmail")]: emp.email, [t("colDepartment")]: emp.department,
          [t("colSbu")]: sbus.find((s) => s.id === emp.sbuId)?.name ?? sbus[0]?.name ?? "—",
          [t("colRole")]: emp.jobTitle, [t("fieldManager")]: emp.manager || "—",
          [t("fieldGross")]: usd(emp.grossPay), [t("fieldBank")]: `${emp.bankName} ${emp.bankAccount}`.trim() || "—",
        }}
        onClose={onClose}
        onDelete={onDelete}
      />
    );
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    onSave(f, index);
  }

  return (
    <Modal title={mode === "create" ? t("modalAdd") : t("modalEdit")} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field"><label>{t("colName")}</label><input required value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
        <div className="field"><label>{t("colEmail")}</label><input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div className="field"><label>{t("colDepartment")}</label><input value={f.department} onChange={(e) => set("department", e.target.value)} /></div>
          <div className="field"><label>{t("colSbu")}</label>
            <select className="settings-select" style={{ width: "100%" }} value={f.sbuId ?? "sbu-hq"} onChange={(e) => set("sbuId", e.target.value)}>
              {sbus.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div className="field"><label>{t("colRole")}</label><input value={f.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} /></div>
          <div className="field"><label>{t("fieldManager")}</label><input value={f.manager ?? ""} onChange={(e) => set("manager", e.target.value)} /></div>
        </div>
        <div className="field"><label>{t("fieldGross")}</label><input type="number" min="0" step="0.01" value={f.grossPay || ""} onChange={(e) => set("grossPay", parseFloat(e.target.value) || 0)} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div className="field"><label>{t("fieldBankName")}</label><input value={f.bankName} onChange={(e) => set("bankName", e.target.value)} /></div>
          <div className="field"><label>{t("fieldBankAccount")}</label><input value={f.bankAccount} onChange={(e) => set("bankAccount", e.target.value)} /></div>
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit">{t("saveEmployee")}</button>
      </form>
    </Modal>
  );
}

export default function CorporateEmployeesDirectoryPage() {
  const t = useTranslations("Pages.corp_emp_directory");
  const { toast } = useAppData();
  const store = useCorpStore();
  const [search, setSearch] = useState("");
  const [sbuFilter, setSbuFilter] = useState("");
  const [sbuOpen, setSbuOpen] = useState(false);
  const [modal, setModal] = useState<{ mode: "view" | "edit" | "create"; emp: CorpEmployee | null; index: number } | null>(null);

  const sbuName = (id?: string) => store.sbus.find((s) => s.id === id)?.code ?? store.sbus[0]?.code ?? "HQ";

  const filtered = useMemo(
    () =>
      store.employees.filter((e) =>
        (!sbuFilter || (e.sbuId ?? "sbu-hq") === sbuFilter) &&
        (e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.email.toLowerCase().includes(search.toLowerCase()) ||
          e.department.toLowerCase().includes(search.toLowerCase()))
      ),
    [store.employees, search, sbuFilter]
  );

  const handleSave = (emp: CorpEmployee, index: number) => {
    updateCorp((s) => ({
      ...s,
      employees: index >= 0 ? s.employees.map((e, i) => (i === index ? emp : e)) : [...s.employees, emp],
    }));
    toast(t(index >= 0 ? "toastUpdated" : "toastAdded", { name: emp.name }));
    setModal(null);
  };

  const handleDelete = () => {
    if (!modal?.emp) return;
    const name = modal.emp.name;
    updateCorp((s) => ({ ...s, employees: s.employees.filter((e) => e.id !== modal.emp!.id) }));
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
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => setSbuOpen(true)}>
            <Icon name="building-2" size={15} style={{ marginRight: 6 }} />{t("addSbu")}
          </button>
          <button className="btn btn-primary" onClick={() => setModal({ mode: "create", emp: null, index: -1 })}>
            <Icon name="plus" size={16} style={{ marginRight: 8 }} />{t("addEmployee")}
          </button>
        </div>
      </div>

      <div className="glass-card card-pad" style={{ marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 12.5, color: "var(--ink-500)", marginRight: 4 }}>{t("sbuFilter")}</span>
        <button className={"chip" + (!sbuFilter ? " active" : "")} onClick={() => setSbuFilter("")}>{t("sbuAll")} ({store.employees.length})</button>
        {store.sbus.map((s) => (
          <button key={s.id} className={"chip" + (sbuFilter === s.id ? " active" : "")} onClick={() => setSbuFilter(s.id)}>
            {s.code} · {s.name} ({store.employees.filter((e) => (e.sbuId ?? "sbu-hq") === s.id).length})
          </button>
        ))}
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder={t("searchPlaceholder")}
          statusOptions={[]}
          onSearchChange={setSearch}
          onStatusChange={() => {}}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={th}>{t("colName")}</th><th style={th}>{t("colEmail")}</th><th style={th}>{t("colDepartment")}</th>
              <th style={th}>{t("colSbu")}</th><th style={th}>{t("colRole")}</th><th style={th}>{t("colGross")}</th><th style={th}>{t("colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>{t("emptyState")}</td></tr>
            )}
            {filtered.map((emp) => {
              const idx = store.employees.findIndex((e) => e.id === emp.id);
              return (
                <tr key={emp.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <td style={{ ...td, fontWeight: 600 }}>{emp.name}</td>
                  <td style={td}>{emp.email}</td>
                  <td style={td}>{emp.department}</td>
                  <td style={td}><span className="chip">{sbuName(emp.sbuId)}</span></td>
                  <td style={td}>{emp.jobTitle}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{usd(emp.grossPay)}</td>
                  <td style={td}>
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => setModal({ mode: "view", emp, index: idx })}><Icon name="eye" size={14} style={{ marginRight: 4 }} />{t("view")}</button>
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => setModal({ mode: "edit", emp, index: idx })}><Icon name="edit" size={14} style={{ marginRight: 4 }} />{t("edit")}</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sbuOpen && <SbuModal onClose={() => setSbuOpen(false)} />}
      {modal && (
        <EmployeeModal
          mode={modal.mode}
          emp={modal.emp}
          index={modal.index}
          sbus={store.sbus}
          onSave={handleSave}
          onDelete={modal.mode === "view" ? handleDelete : undefined}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
