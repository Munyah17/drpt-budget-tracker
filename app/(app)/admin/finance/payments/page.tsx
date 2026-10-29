"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useCrud } from "@/lib/useCrud";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

interface Payment {
  paymentId: string;
  organisation: string;
  amount: string;
  method: string;
  date: string;
  status: string;
}

const PAYMENTS_DATA: Payment[] = [];

export default function AdminPaymentsPage() {
  const t = useTranslations("Pages.adm_finance_payments");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const crud = useCrud(PAYMENTS_DATA, "Payment");

  const filteredData = useMemo(() => {
    return crud.items.filter((payment) =>
      (!statusFilter || payment.status === statusFilter) &&
      (payment.paymentId.toLowerCase().includes(search.toLowerCase()) || payment.organisation.toLowerCase().includes(search.toLowerCase()))
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
          {t("recordPayment")}
        </button>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder={t("searchPlaceholder")}
          statusOptions={[{ value: "Completed", label: t("statusCompleted") }, { value: "Pending", label: t("statusPending") }]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thPaymentId")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thOrganisation")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thAmount")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thMethod")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thDate")}</th>
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
            {filteredData.map((payment, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)", cursor: "pointer" }} onClick={() => crud.openModal("view", payment, crud.items.indexOf(payment))}>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{payment.paymentId}</td>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{payment.organisation}</td>
                <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 600 }}>{payment.amount}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{payment.method}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{payment.date}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${payment.status === "Completed" ? "badge-green" : "badge-amber"}`}>
                    {payment.status}
                  </span>
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
