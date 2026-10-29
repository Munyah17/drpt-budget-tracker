"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";
import RecordModal, { RowRecord } from "@/components/RecordModal";

interface Benefit {
  name: string;
  provider: string;
  enrolled: string;
  cost: string;
  status: string;
}

const BENEFITS_DATA: Benefit[] = [];

export default function CorporateBenefitsPage() {
  const t = useTranslations("Pages.corp_benefits");
  const { toast } = useAppData();
  const [benefits, setBenefits] = useState<Benefit[]>(BENEFITS_DATA);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState<{ mode: "view" | "edit" | "create"; record: RowRecord; index: number } | null>(null);

  const filteredData = useMemo(() => {
    return benefits.filter((b) =>
      (!statusFilter || b.status === statusFilter) &&
      (b.name.toLowerCase().includes(search.toLowerCase()) || b.provider.toLowerCase().includes(search.toLowerCase()))
    );
  }, [benefits, search, statusFilter]);

  const openModal = (mode: "view" | "edit" | "create", b?: Benefit, index?: number) => {
    const record: RowRecord = b
      ? { name: b.name, provider: b.provider, enrolled: b.enrolled, cost: b.cost, status: b.status }
      : { name: "", provider: "", enrolled: "0", cost: "", status: "Active" };
    setModal({ mode, record, index: index ?? -1 });
  };

  const handleSave = (values: RowRecord) => {
    if (!modal) return;
    const b: Benefit = { name: values.name, provider: values.provider, enrolled: values.enrolled, cost: values.cost, status: values.status || "Active" };
    if (modal.mode === "create") {
      setBenefits((prev) => [...prev, b]);
      toast(t("toastAdded", { name: b.name }));
    } else {
      setBenefits((prev) => prev.map((e, i) => (i === modal.index ? b : e)));
      toast(t("toastUpdated", { name: b.name }));
    }
    setModal(null);
  };

  const handleDelete = () => {
    if (!modal) return;
    const name = modal.record.name;
    setBenefits((prev) => prev.filter((_, i) => i !== modal.index));
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
          {t("addBenefit")}
        </button>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder={t("searchPlaceholder")}
          statusOptions={[{ value: "Active", label: t("statusActive") }, { value: "Review", label: t("statusReview") }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thBenefit")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thProvider")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thEnrolled")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thMonthlyCost")}</th>
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
            {filteredData.map((b, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{b.name}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{b.provider}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{b.enrolled}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{b.cost}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${b.status === "Active" ? "badge-green" : "badge-amber"}`}>
                    {b.status === "Active" ? t("statusActive") : b.status === "Review" ? t("statusReview") : b.status}
                  </span>
                </td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => openModal("view", b, benefits.indexOf(b))}><Icon name="eye" size={14} style={{ marginRight: 4 }} />{t("view")}</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => openModal("edit", b, benefits.indexOf(b))}><Icon name="edit" size={14} style={{ marginRight: 4 }} />{t("edit")}</button>
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
