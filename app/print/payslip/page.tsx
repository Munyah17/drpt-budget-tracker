"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { PAYSLIP_KEY, PayslipDoc } from "@/lib/payslip";

const EMPTY: PayslipDoc = {
  company: "",
  companyAddress: "",
  period: "",
  employeeId: "",
  department: "",
  dateOfJoining: "",
  bankNameBranch: "",
  name: "",
  designation: "",
  daysWorked: "",
  bankAccount: "",
  earnings: [],
  deductions: [],
  currencyLabel: "Dollar",
};

const emptySubscribe = () => () => {};
let cached: { raw: string | null; doc: PayslipDoc } | undefined;

function readDoc(): PayslipDoc {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(PAYSLIP_KEY);
  } catch {
    /* unavailable */
  }
  if (cached && cached.raw === raw) return cached.doc;
  let doc = EMPTY;
  try {
    if (raw) doc = JSON.parse(raw) as PayslipDoc;
  } catch {
    /* malformed — show empty */
  }
  cached = { raw, doc };
  return doc;
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const DetailCell = ({ label, value }: { label: string; value: string }) => (
  <div className="ps-detail">
    <span className="ps-dlabel">{label}</span>
    <span className="ps-dcolon">:</span>
    <span className="ps-dvalue">{value}</span>
  </div>
);

export default function PrintPayslipPage() {
  const t = useTranslations("Pages.print_payslip");
  const doc = useSyncExternalStore<PayslipDoc>(emptySubscribe, readDoc, () => EMPTY);

  const totalEarnings = doc.earnings.reduce((s, e) => s + e.amount, 0);
  const totalDeductions = doc.deductions.reduce((s, d) => s + d.amount, 0);
  const netPay = Math.round(totalEarnings - totalDeductions);
  const rows = Math.max(doc.earnings.length, doc.deductions.length);

  return (
    <div className="print-screen">
      <style>{`
        @page { size: A4 landscape; margin: 10mm; }
        * { box-sizing: border-box; font-family: 'Times New Roman', Georgia, serif; }
        .print-screen { min-height: 100vh; background: #525659; padding: 24px 16px 48px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .print-toolbar { display: flex; gap: 10px; position: sticky; top: 12px; z-index: 10; }
        .print-toolbar button { border: none; border-radius: 8px; padding: 10px 22px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'Segoe UI', Arial, sans-serif; }
        .pt-primary { background: #1E40AF; color: #fff; }
        .pt-ghost { background: #fff; color: #141414; }
        .sheet { width: 277mm; max-width: 100%; background: #fff; padding: 10mm 14mm; color: #111; box-shadow: 0 4px 24px rgba(0,0,0,.35); }
        .ps-frame { border: 1px solid #333; border-top: 3px solid #333; padding: 18px 22px; }
        .ps-head { text-align: center; margin-bottom: 10px; }
        .ps-company { font-size: 24px; font-weight: 800; letter-spacing: .01em; }
        .ps-addr { font-size: 13px; color: #333; margin: 2px 0 10px; }
        .ps-title { font-size: 17px; font-weight: 700; }
        .ps-details { display: flex; justify-content: space-between; gap: 40px; margin: 14px 0 16px; font-size: 13.5px; }
        .ps-col { display: flex; flex-direction: column; gap: 5px; }
        .ps-detail { display: flex; align-items: baseline; }
        .ps-dlabel { width: 150px; color: #333; }
        .ps-dcolon { width: 14px; }
        .ps-dvalue { font-weight: 600; }
        table.ps { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        table.ps th, table.ps td { border: 1px solid #333; padding: 5px 12px; }
        table.ps thead th { text-align: left; font-size: 14px; }
        table.ps th.amt, table.ps td.amt { text-align: right; width: 130px; }
        table.ps tr.tot td { font-weight: 700; border-top: 1.5px solid #333; }
        table.ps tr.net td { font-weight: 700; text-align: center; }
        table.ps tr.net td.amt { text-align: right; }
        .ps-note { text-align: center; font-size: 12.5px; margin: 10px 0 26px; }
        .ps-sigs { display: flex; justify-content: space-between; font-size: 13px; }
        .ps-sig { text-align: center; }
        .ps-sig .line { border-top: 1px solid #333; width: 220px; margin-bottom: 4px; padding-top: 4px; }
        @media print {
          .print-screen { background: #fff; padding: 0; }
          .print-toolbar { display: none; }
          .sheet { box-shadow: none; width: 100%; padding: 0; }
        }
      `}</style>

      <div className="print-toolbar">
        <button className="pt-primary" onClick={() => window.print()}>{t("printPdf")}</button>
        <button className="pt-ghost" onClick={() => window.close()}>{t("close")}</button>
      </div>

      <div className="sheet">
        <div className="ps-frame">
          <div className="ps-head">
            <div className="ps-company">{doc.company || t("companyName")}</div>
            <div className="ps-addr">{doc.companyAddress}</div>
            <div className="ps-title">{t("title", { period: doc.period })}</div>
          </div>

          <div className="ps-details">
            <div className="ps-col">
              <DetailCell label={t("employeeId")} value={doc.employeeId} />
              <DetailCell label={t("department")} value={doc.department} />
              <DetailCell label={t("dateOfJoining")} value={doc.dateOfJoining} />
              <DetailCell label={t("bankNameBranch")} value={doc.bankNameBranch} />
            </div>
            <div className="ps-col">
              <DetailCell label={t("name")} value={doc.name} />
              <DetailCell label={t("designation")} value={doc.designation} />
              <DetailCell label={t("daysWorked")} value={doc.daysWorked} />
              <DetailCell label={t("bankAccount")} value={doc.bankAccount} />
            </div>
          </div>

          <table className="ps">
            <thead>
              <tr>
                <th>{t("earnings")}</th>
                <th className="amt">{t("amount")}</th>
                <th>{t("deductions")}</th>
                <th className="amt">{t("amount")}</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }, (_, i) => (
                <tr key={i}>
                  <td>{doc.earnings[i]?.label ?? ""}</td>
                  <td className="amt">{doc.earnings[i] ? fmt(doc.earnings[i].amount) : ""}</td>
                  <td>{doc.deductions[i]?.label ?? ""}</td>
                  <td className="amt">{doc.deductions[i] ? fmt(doc.deductions[i].amount) : ""}</td>
                </tr>
              ))}
              <tr className="tot">
                <td>{t("totalEarnings")}</td>
                <td className="amt">{fmt(totalEarnings)}</td>
                <td>{t("totalDeductions")}</td>
                <td className="amt">{fmt(totalDeductions)}</td>
              </tr>
              <tr className="net">
                <td colSpan={3}>{t("netPay")}</td>
                <td className="amt">{fmt(netPay)}</td>
              </tr>
            </tbody>
          </table>

          <div className="ps-note">{t("allFigures", { currency: doc.currencyLabel })}</div>

          <div className="ps-sigs">
            <div className="ps-sig">
              <div className="line" />
              {t("employerSig")}
            </div>
            <div className="ps-sig">
              <div className="line" />
              {t("employeeSig")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
