"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("Pages.corp_emp_onboarding");
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
      toast(t("toastStarted", { name: item.name }));
    } else {
      setItems((prev) => prev.map((e, i) => (i === modal.index ? item : e)));
      toast(t("toastUpdated", { name: item.name }));
    }
    setModal(null);
  };

  const handleDelete = () => {
    if (!modal) return;
    const name = modal.record.name;
    setItems((prev) => prev.filter((_, i) => i !== modal.index));
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
          {t("startOnboarding")}
        </button>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder={t("searchPlaceholder")}
          categoryOptions={[{ value: "Documents", label: t("stageDocuments") }, { value: "IT Setup", label: t("stageItSetup") }, { value: "Contract", label: t("stageContract") }]}
          onSearchChange={setSearch}
          onCategoryChange={setStageFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colName")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colEmail")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colDepartment")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colStartDate")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colStage")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colProgress")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  {t("emptyState")}
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
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => openModal("view", item, items.indexOf(item))}><Icon name="eye" size={14} style={{ marginRight: 4 }} />{t("view")}</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => openModal("edit", item, items.indexOf(item))}><Icon name="edit" size={14} style={{ marginRight: 4 }} />{t("edit")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <RecordModal
          mode={modal.mode}
          title={modal.mode === "create" ? t("modalStart") : modal.mode === "edit" ? t("modalEdit") : t("modalDetails")}
          record={modal.record}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={modal.mode === "view" ? handleDelete : undefined}
        />
      )}
    </>
  );
}
