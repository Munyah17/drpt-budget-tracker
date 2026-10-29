"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";
import Modal from "@/components/Modal";
import { buildPayslipDoc, openPayslipPdf, payslipTotals, usd, PayslipDoc } from "@/lib/payslip";

interface Payslip {
  employee: string;
  period: string;
  status: string;
  doc: PayslipDoc;
}

const PAYSLIPS_DATA: Payslip[] = [];

function GenerateModal({ onGenerate, onClose }: { onGenerate: (period: string) => void; onClose: () => void }) {
  const t = useTranslations("Pages.corp_pay_payslips");
  const [period, setPeriod] = useState("June 2025");
  return (
    <Modal title={t("modalTitle")} onClose={onClose}>
      <div className="field">
        <label>{t("fieldPayPeriod")}</label>
        <select className="settings-select" style={{ width: "100%" }} value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option>June 2025</option>
          <option>July 2025</option>
          <option>August 2025</option>
        </select>
      </div>
      <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => onGenerate(period)}>{t("generate")}</button>
    </Modal>
  );
}

export default function CorporatePayslipsPage() {
  const t = useTranslations("Pages.corp_pay_payslips");
  const { toast, user } = useAppData();
  const [payslips, setPayslips] = useState<Payslip[]>(PAYSLIPS_DATA);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [genOpen, setGenOpen] = useState(false);

  const filteredData = useMemo(() => {
    return payslips.filter((p) =>
      (!statusFilter || p.status === statusFilter) &&
      p.employee.toLowerCase().includes(search.toLowerCase())
    );
  }, [payslips, search, statusFilter]);

  const handleDownload = (p: Payslip) => {
    openPayslipPdf(p.doc);
    toast(t("toastOpened", { employee: p.employee }), "download");
  };

  const handleSend = (p: Payslip) => {
    setPayslips((prev) => prev.map((x) => (x === p ? { ...x, status: "Delivered" } : x)));
    toast(t("toastSent", { employee: p.employee }), "send");
  };

  const handleGenerate = (period: string) => {
    const existing = new Set(payslips.map((p) => `${p.employee}|${p.period}`));
    const additions = ["Emma Wilson", "David Brown", "Lisa Chen", "James Patel"]
      .filter((e) => !existing.has(`${e}|${period}`))
      .map((employee) => ({
        employee,
        period,
        status: "Pending",
        doc: buildPayslipDoc({
          employee,
          period,
          company: user?.organisation ?? "Acme Corporation",
        }),
      }));
    setPayslips((prev) => [...prev, ...additions]);
    toast(t("toastGenerated", { count: additions.length, period }));
    setGenOpen(false);
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setGenOpen(true)}>
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
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colEmployee")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colPeriod")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colGross")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colNet")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colStatus")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colActions")}</th>
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
            {filteredData.map((p, idx) => {
              const totals = payslipTotals(p.doc);
              return (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{p.employee}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{p.period}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{usd(totals.gross)}</td>
                <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 600 }}>{usd(totals.net)}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${p.status === "Delivered" ? "badge-green" : "badge-amber"}`}>
                    {p.status}
                  </span>
                </td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleDownload(p)}><Icon name="download" size={14} style={{ marginRight: 4 }} />{t("pdf")}</button>
                  {p.status !== "Delivered" && (
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleSend(p)}><Icon name="send" size={14} style={{ marginRight: 4 }} />{t("send")}</button>
                  )}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {genOpen && <GenerateModal onGenerate={handleGenerate} onClose={() => setGenOpen(false)} />}
    </>
  );
}
