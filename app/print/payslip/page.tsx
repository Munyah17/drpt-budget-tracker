"use client";

import { useSyncExternalStore } from "react";
import { PAYSLIP_KEY, PayslipDoc, PayslipFlag } from "@/lib/payslip";

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
  flag: "none",
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

/** Simplified Zimbabwe flag — 7 stripes + white triangle + red star. */
function ZwFlag() {
  const stripes = ["#009543", "#FFD200", "#D21034", "#000000", "#D21034", "#FFD200", "#009543"];
  return (
    <div style={{ position: "relative", width: 96, height: 60, flexShrink: 0 }}>
      {stripes.map((c, i) => (
        <div key={i} style={{ height: 60 / 7, background: c }} />
      ))}
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: 0,
          height: 0,
          borderTop: "30px solid transparent",
          borderBottom: "30px solid transparent",
          borderLeft: "42px solid #ffffff",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 7,
          top: "50%",
          transform: "translateY(-52%)",
          color: "#D21034",
          fontSize: 24,
          lineHeight: 1,
        }}
      >
        ★
      </div>
    </div>
  );
}

/** Header emblem — whichever flag/logo the doc supplies. */
function FlagEmblem({ flag }: { flag: PayslipFlag | undefined }) {
  if (!flag || flag === "none") return null;
  if (flag === "zw") return <ZwFlag />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={flag.image} alt={flag.alt ?? "Flag"} style={{ width: 96, height: 60, objectFit: "contain" }} />;
}

const DetailCell = ({ label, value }: { label: string; value: string }) => (
  <div className="ps-detail">
    <span className="ps-dlabel">{label}</span>
    <span className="ps-dcolon">:</span>
    <span className="ps-dvalue">{value}</span>
  </div>
);

export default function PrintPayslipPage() {
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
        .ps-head { position: relative; text-align: center; margin-bottom: 10px; }
        .ps-head .zw { position: absolute; right: 0; top: 0; }
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
        <button className="pt-primary" onClick={() => window.print()}>Print / Save as PDF</button>
        <button className="pt-ghost" onClick={() => window.close()}>Close</button>
      </div>

      <div className="sheet">
        <div className="ps-frame">
          <div className="ps-head">
            <div className="zw"><FlagEmblem flag={doc.flag} /></div>
            <div className="ps-company">{doc.company || "Company Name"}</div>
            <div className="ps-addr">{doc.companyAddress}</div>
            <div className="ps-title">Payslip for the period of {doc.period}</div>
          </div>

          <div className="ps-details">
            <div className="ps-col">
              <DetailCell label="Employee Id" value={doc.employeeId} />
              <DetailCell label="Department" value={doc.department} />
              <DetailCell label="Date Of Joining" value={doc.dateOfJoining} />
              <DetailCell label="Bank Name, Branch" value={doc.bankNameBranch} />
            </div>
            <div className="ps-col">
              <DetailCell label="Name" value={doc.name} />
              <DetailCell label="Designation" value={doc.designation} />
              <DetailCell label="Days Worked" value={doc.daysWorked} />
              <DetailCell label="Bank Acct/Cheque Number" value={doc.bankAccount} />
            </div>
          </div>

          <table className="ps">
            <thead>
              <tr>
                <th>Earnings</th>
                <th className="amt">Amount</th>
                <th>Deductions</th>
                <th className="amt">Amount</th>
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
                <td>Total Earnings</td>
                <td className="amt">{fmt(totalEarnings)}</td>
                <td>Total Deductions</td>
                <td className="amt">{fmt(totalDeductions)}</td>
              </tr>
              <tr className="net">
                <td colSpan={3}>Net Pay (Rounded)</td>
                <td className="amt">{fmt(netPay)}</td>
              </tr>
            </tbody>
          </table>

          <div className="ps-note">(All figures in {doc.currencyLabel})</div>

          <div className="ps-sigs">
            <div className="ps-sig">
              <div className="line" />
              Employer&apos;s Signature
            </div>
            <div className="ps-sig">
              <div className="line" />
              Employee&apos;s Signature
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
