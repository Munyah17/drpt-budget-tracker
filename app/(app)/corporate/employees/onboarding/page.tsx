"use client";

import { useState, useMemo } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";
import RecordModal, { RowRecord } from "@/components/RecordModal";

interface OnboardingItem {
  name: string;
  email: string;
  department: string;
  startDate: string;
  stage: string;
  progress: string;
}

const ONBOARDING_DATA: OnboardingItem[] = [];

export default function CorporateOnboardingPage() {
  const { toast } = useAppData();
  const [items, setItems] = useState<OnboardingItem[]>(ONBOARDING_DATA);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [modal, setModal] = useState<{ mode: "view" | "edit" | "create"; record: RowRecord; index: number } | null>(null);

  const filteredData = useMemo(() => {
    return items.filter((item) =>
      (!stageFilter || item.stage === stageFilter) &&
      item.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search, stageFilter]);

  const openModal = (mode: "view" | "edit" | "create", item?: OnboardingItem, index?: number) => {
    const record: RowRecord = item
      ? { name: item.name, email: item.email, department: item.department, startDate: item.startDate, stage: item.stage, progress: item.progress }
      : { name: "", email: "", department: "", startDate: "", stage: "Contract", progress: "0%" };
    setModal({ mode, record, index: index ?? -1 });
  };

  const handleSave = (values: RowRecord) => {
    if (!modal) return;
    const item: OnboardingItem = { name: values.name, email: values.email, department: values.department, startDate: values.startDate, stage: values.stage, progress: values.progress };
    if (modal.mode === "create") {
      setItems((prev) => [...prev, item]);
      toast(`Onboarding started for ${item.name}`);
    } else {
      setItems((prev) => prev.map((e, i) => (i === modal.index ? item : e)));
      toast(`${item.name} updated`);
    }
    setModal(null);
  };

  const handleDelete = () => {
    if (!modal) return;
    const name = modal.record.name;
    setItems((prev) => prev.filter((_, i) => i !== modal.index));
    toast(`${name} removed from onboarding`, "trash-2");
    setModal(null);
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Employee Onboarding</h2>
          <p className="section-sub">Track new hire onboarding progress</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal("create")}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          Start Onboarding
        </button>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder="Search new hires..."
          categoryOptions={[{ value: "Documents", label: "Documents" }, { value: "IT Setup", label: "IT Setup" }, { value: "Contract", label: "Contract" }]}
          onSearchChange={setSearch}
          onCategoryChange={setStageFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Name</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Email</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Department</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Start Date</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Stage</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Progress</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  No onboarding items match your search.
                </td>
              </tr>
            )}
            {filteredData.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{item.name}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{item.email}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{item.department}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{item.startDate}</td>
                <td style={{ padding: "12px 8px" }}><span className="badge badge-blue">{item.stage}</span></td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{item.progress}</td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => openModal("view", item, items.indexOf(item))}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => openModal("edit", item, items.indexOf(item))}><Icon name="edit" size={14} style={{ marginRight: 4 }} />Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <RecordModal
          mode={modal.mode}
          title={modal.mode === "create" ? "Start Onboarding" : modal.mode === "edit" ? "Edit Onboarding" : "Onboarding Details"}
          record={modal.record}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={modal.mode === "view" ? handleDelete : undefined}
        />
      )}
    </>
  );
}
