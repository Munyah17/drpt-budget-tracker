"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

import { useCrud } from "@/lib/useCrud";
interface AccountingIntegration {
  name: string;
  category: string;
  organisations: string;
  status: string;
  syncFrequency: string;
}

const ACCOUNTING_DATA: AccountingIntegration[] = [];

export default function AdminAccountingPage() {
  const t = useTranslations("Pages.adm_int_accounting");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const crud = useCrud(ACCOUNTING_DATA, "Integration");

  const { toast } = useAppData();
  const filteredData = useMemo(() => {
    return crud.items.filter((integration) =>
      (!statusFilter || integration.status === statusFilter) &&
      (integration.name.toLowerCase().includes(search.toLowerCase()) || integration.category.toLowerCase().includes(search.toLowerCase()))
    );
  }, [crud.items, search, statusFilter]);

  const handleSync = (item: string) => {
    toast(t("toastSyncing", { item }));
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
          {t("addIntegration")}
        </button>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder={t("searchPlaceholder")}
          statusOptions={[{ value: "Connected", label: t("statusConnected") }, { value: "Degraded", label: t("statusDegraded") }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thSoftware")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thCategory")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thOrganisations")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thStatus")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thSyncFrequency")}</th>
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
            {filteredData.map((integration, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{integration.name}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{integration.category}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{integration.organisations}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${integration.status === "Connected" ? "badge-green" : "badge-amber"}`}>
                    {integration.status}
                  </span>
                </td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{integration.syncFrequency}</td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleSync(integration.name)}><Icon name="refresh-cw" size={14} style={{ marginRight: 4 }} />{t("sync")}</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => crud.openModal("edit", integration, crud.items.indexOf(integration))}><Icon name="edit" size={14} style={{ marginRight: 4 }} />{t("edit")}</button>
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
