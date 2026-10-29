"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

import { useCrud } from "@/lib/useCrud";
interface Payslip {
  employee: string;
  organisation: string;
  period: string;
  status: string;
  delivered: string;
}

const PAYSLIPS_DATA: Payslip[] = [];

export default function AdminPayslipsPage() {
  const t = useTranslations("Pages.adm_ops_payslips");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const crud = useCrud(PAYSLIPS_DATA, "Payslip");

  const { toast } = useAppData();
  const filteredData = useMemo(() => {
    return crud.items.filter((payslip) =>
      (!statusFilter || payslip.status === statusFilter) &&
      (payslip.employee.toLowerCase().includes(search.toLowerCase()) || payslip.organisation.toLowerCase().includes(search.toLowerCase()))
    );
  }, [crud.items, search, statusFilter]);

  const handleDownload = (item: string) => {
    toast(t("toastDownloading", { item }));
  };

  const handleSend = (item: string) => {
    toast(t("toastSending", { item }));
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
          {t("generatePayslips")}
        </button>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder={t("searchPlaceholder")}
          statusOptions={[{ value: "Delivered", label: t("statusDelivered") }, { value: "Pending", label: t("statusPending") }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thEmployee")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thOrganisation")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thPeriod")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thStatus")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thDelivered")}</th>
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
            {filteredData.map((payslip, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{payslip.employee}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{payslip.organisation}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{payslip.period}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${payslip.status === "Delivered" ? "badge-green" : "badge-amber"}`}>
                    {payslip.status}
                  </span>
                </td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{payslip.delivered}</td>
                <td style={{ padding: "12px 8px" }}>
                  {payslip.status === "Delivered" ? (
                    <>
                      <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleDownload(payslip.employee)}><Icon name="download" size={14} style={{ marginRight: 4 }} />{t("download")}</button>
                      <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleSend(payslip.employee)}><Icon name="send" size={14} style={{ marginRight: 4 }} />{t("resend")}</button>
                    </>
                  ) : (
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleSend(payslip.employee)}><Icon name="send" size={14} style={{ marginRight: 4 }} />{t("send")}</button>
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
