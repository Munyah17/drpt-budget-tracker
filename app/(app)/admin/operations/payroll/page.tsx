"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

import { useCrud } from "@/lib/useCrud";
interface PayrollBatch {
  batchId: string;
  organisation: string;
  employees: string;
  status: string;
  submitted: string;
}

const PAYROLL_DATA: PayrollBatch[] = [];

export default function AdminPayrollPage() {
  const t = useTranslations("Pages.adm_ops_payroll");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const crud = useCrud(PAYROLL_DATA, "Payroll Run");

  const { toast } = useAppData();
  const filteredData = useMemo(() => {
    return crud.items.filter((batch) =>
      (!statusFilter || batch.status === statusFilter) &&
      (batch.batchId.toLowerCase().includes(search.toLowerCase()) || batch.organisation.toLowerCase().includes(search.toLowerCase()))
    );
  }, [crud.items, search, statusFilter]);

  const handleRetry = (item: string) => {
    toast(t("toastRetrying", { item }));
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
          {t("newBatch")}
        </button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statPendingBatches")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statInProcessing")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statCompletedToday")}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statFailed")}</div>
          <div className="stat-value">—</div>
        </div>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder={t("searchPlaceholder")}
          statusOptions={[{ value: "Processing", label: t("statusProcessing") }, { value: "Completed", label: t("statusCompleted") }, { value: "Failed", label: t("statusFailed") }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thBatchId")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thOrganisation")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thEmployees")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thStatus")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thSubmitted")}</th>
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
            {filteredData.map((batch, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{batch.batchId}</td>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{batch.organisation}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{batch.employees}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${batch.status === "Completed" ? "badge-green" : batch.status === "Processing" ? "badge-blue" : "badge-red"}`}>
                    {batch.status}
                  </span>
                </td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{batch.submitted}</td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => crud.openModal("view", batch, crud.items.indexOf(batch))}><Icon name="eye" size={14} style={{ marginRight: 4 }} />{t("view")}</button>
                  {batch.status === "Failed" && (
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleRetry(batch.batchId)}><Icon name="refresh-cw" size={14} style={{ marginRight: 4 }} />{t("retry")}</button>
                  )}
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
