"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

import { useCrud } from "@/lib/useCrud";
interface PayrollProvider {
  name: string;
  type: string;
  clients: string;
  status: string;
  integration: string;
}

const PAYROLL_DATA: PayrollProvider[] = [];

export default function AdminPayrollProvidersPage() {
  const t = useTranslations("Pages.adm_int_payroll");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const crud = useCrud(PAYROLL_DATA, "Integration");

  const { toast } = useAppData();
  const filteredData = useMemo(() => {
    return crud.items.filter((provider) =>
      (!statusFilter || provider.status === statusFilter) &&
      (provider.name.toLowerCase().includes(search.toLowerCase()) || provider.type.toLowerCase().includes(search.toLowerCase()))
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
          {t("addProvider")}
        </button>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder={t("searchPlaceholder")}
          statusOptions={[{ value: "Active", label: t("statusActive") }, { value: "Inactive", label: t("statusInactive") }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thProvider")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thType")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thClients")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thStatus")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thIntegration")}</th>
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
            {filteredData.map((provider, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{provider.name}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{provider.type}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{provider.clients}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${provider.status === "Active" ? "badge-green" : "badge-amber"}`}>
                    {provider.status}
                  </span>
                </td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${provider.integration === "Connected" ? "badge-green" : "badge-amber"}`}>
                    {provider.integration}
                  </span>
                </td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleSync(provider.name)}><Icon name="refresh-cw" size={14} style={{ marginRight: 4 }} />{t("sync")}</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => crud.openModal("edit", provider, crud.items.indexOf(provider))}><Icon name="edit" size={14} style={{ marginRight: 4 }} />{t("edit")}</button>
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
