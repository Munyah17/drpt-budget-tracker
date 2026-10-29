"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useCrud } from "@/lib/useCrud";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

interface Contract {
  organisation: string;
  plan: string;
  monthlyFee: string;
  startDate: string;
  renewal: string;
  status: string;
}

const CONTRACTS_DATA: Contract[] = [];

export default function AdminContractsPage() {
  const t = useTranslations("Pages.adm_orgs_contracts");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const crud = useCrud(CONTRACTS_DATA, t("entityName"));

  const filteredData = useMemo(() => {
    return crud.items.filter((contract) =>
      (!statusFilter || contract.status === statusFilter) &&
      contract.organisation.toLowerCase().includes(search.toLowerCase())
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
          {t("addContract")}
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
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thOrganisation")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thPlan")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thMonthlyFee")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thStartDate")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thRenewal")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thStatus")}</th>
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
            {filteredData.map((contract, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)", cursor: "pointer" }} onClick={() => crud.openModal("view", contract, crud.items.indexOf(contract))}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{contract.organisation}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{contract.plan}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{contract.monthlyFee}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{contract.startDate}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{contract.renewal}</td>
                <td style={{ padding: "12px 8px" }}><span className="badge badge-green">{contract.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {crud.modalNode}
    </>
  );
}
