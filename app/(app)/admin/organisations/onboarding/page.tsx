"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

import { useCrud } from "@/lib/useCrud";
interface Onboarding {
  organisation: string;
  contact: string;
  stage: string;
  progress: string;
  assigned: string;
}

const ONBOARDING_DATA: Onboarding[] = [];

export default function AdminOnboardingPage() {
  const t = useTranslations("Pages.adm_orgs_onboarding");
  const [search, setSearch] = useState("");
  const crud = useCrud(ONBOARDING_DATA, t("entityName"));

  const [stageFilter, setStageFilter] = useState("");

  const filteredData = useMemo(() => {
    return crud.items.filter((item) =>
      (!stageFilter || item.stage === stageFilter) &&
      item.organisation.toLowerCase().includes(search.toLowerCase())
    );
  }, [crud.items, search, stageFilter]);

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={() => crud.openModal("create")}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          {t("addOnboarding")}
        </button>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder={t("searchPlaceholder")}
          categoryOptions={[{ value: "Integration Setup", label: t("stageIntegrationSetup") }, { value: "Contract Review", label: t("stageContractReview") }]}
          onSearchChange={setSearch}
          onCategoryChange={setStageFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thOrganisation")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thContact")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thStage")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thProgress")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thAssigned")}</th>
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
            {filteredData.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{item.organisation}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{item.contact}</td>
                <td style={{ padding: "12px 8px" }}><span className={`badge ${item.stage === "Integration Setup" ? "badge-blue" : "badge-amber"}`}>{item.stage}</span></td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{item.progress}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{item.assigned}</td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => crud.openModal("view", item, crud.items.indexOf(item))}><Icon name="eye" size={14} style={{ marginRight: 4 }} />{t("view")}</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => crud.openModal("edit", item, crud.items.indexOf(item))}><Icon name="edit" size={14} style={{ marginRight: 4 }} />{t("edit")}</button>
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
