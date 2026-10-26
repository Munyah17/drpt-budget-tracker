"use client";

import { useSyncExternalStore } from "react";

export const STATEMENT_KEY = "drpt-statement";

interface StatementRow {
  date: string;
  payee: string;
  category: string;
  note?: string;
  in: string;
  out: string;
  balance: string;
}

interface StatementDoc {
  title: string;
  accountName: string;
  currency: string;
  period: string;
  generated: string;
  opening: string;
  totalIn: string;
  totalOut: string;
  closing: string;
  rows: StatementRow[];
}

const EMPTY: StatementDoc = {
  title: "Cash Statement",
  accountName: "",
  currency: "",
  period: "",
  generated: "",
  opening: "",
  totalIn: "",
  totalOut: "",
  closing: "",
  rows: [],
};

const emptySubscribe = () => () => {};
let cached: { raw: string | null; doc: StatementDoc } | undefined;

function readDoc(): StatementDoc {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(STATEMENT_KEY);
  } catch {
    /* unavailable */
  }
  if (cached && cached.raw === raw) return cached.doc;
  let doc = EMPTY;
  try {
    if (raw) doc = JSON.parse(raw) as StatementDoc;
  } catch {
    /* malformed — show empty */
  }
  cached = { raw, doc };
  return doc;
}

export default function PrintStatementPage() {
  const doc = useSyncExternalStore<StatementDoc>(emptySubscribe, readDoc, () => EMPTY);

  return (
    <div className="print-screen">
      <style>{`
        @page { size: A4; margin: 14mm; }
        * { box-sizing: border-box; font-family: 'Segoe UI', 'Source Sans 3', Arial, sans-serif; }
        .print-screen { min-height: 100vh; background: #525659; padding: 24px 16px 48px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .print-toolbar { display: flex; gap: 10px; position: sticky; top: 12px; z-index: 10; }
        .print-toolbar button { border: none; border-radius: 8px; padding: 10px 22px; font-size: 14px; font-weight: 600; cursor: pointer; }
        .pt-primary { background: #1E40AF; color: #fff; }
        .pt-ghost { background: #fff; color: #141414; }
        .sheet { width: 210mm; max-width: 100%; min-height: 297mm; background: #fff; padding: 18mm; color: #111; box-shadow: 0 4px 24px rgba(0,0,0,.35); }
        .st-head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #c81457; padding-bottom: 14px; margin-bottom: 14px; }
        .st-logo { font-size: 26px; font-weight: 800; color: #1a1a1a; }
        .st-logo em { color: #c81457; font-style: normal; }
        .st-title { text-align: right; font-size: 12px; color: #555; line-height: 1.6; }
        .st-title b { font-size: 16px; color: #111; display: block; }
        .st-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
        .st-sum { border: 1px solid #e5e5e5; border-radius: 8px; padding: 10px 12px; }
        .st-sum .k { font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: #888; }
        .st-sum .v { font-size: 17px; font-weight: 700; margin-top: 2px; }
        .st-sum .v.pos { color: #1a9c6d; } .st-sum .v.neg { color: #c81457; }
        table.st { width: 100%; border-collapse: collapse; font-size: 11.5px; }
        table.st thead th { background: #1a1a1a; color: #fff; text-align: left; padding: 7px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: .05em; }
        table.st thead th.r, table.st td.r { text-align: right; }
        table.st tbody td { padding: 6px 8px; border-bottom: 1px solid #eee; vertical-align: top; }
        table.st tbody tr:nth-child(even) td { background: #faf7f8; }
        .st-cat { font-size: 9.5px; color: #888; text-transform: uppercase; letter-spacing: .04em; }
        .st-in { color: #1a9c6d; font-weight: 600; } .st-out { color: #c81457; font-weight: 600; }
        .st-foot { margin-top: 16px; font-size: 10px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
        @media print {
          .print-screen { background: #fff; padding: 0; }
          .print-toolbar { display: none; }
          .sheet { box-shadow: none; width: 100%; min-height: auto; padding: 0; }
        }
      `}</style>

      <div className="print-toolbar">
        <button className="pt-primary" onClick={() => window.print()}>Print / Save as PDF</button>
        <button className="pt-ghost" onClick={() => window.close()}>Close</button>
      </div>

      <div className="sheet">
        <div className="st-head">
          <div>
            <div className="st-logo">WellSpend <em>❤</em></div>
            <div style={{ fontSize: 11, color: "#777" }}>Personal cash tracker</div>
          </div>
          <div className="st-title">
            <b>{doc.title || "Cash Statement"}</b>
            {doc.accountName && <div>{doc.accountName}</div>}
            {doc.period && <div>{doc.period}</div>}
            <div>Generated {doc.generated}</div>
          </div>
        </div>

        <div className="st-summary">
          <div className="st-sum"><div className="k">Money in</div><div className="v pos">{doc.totalIn}</div></div>
          <div className="st-sum"><div className="k">Money out</div><div className="v neg">{doc.totalOut}</div></div>
          <div className="st-sum"><div className="k">Net</div><div className="v">{doc.closing}</div></div>
          <div className="st-sum"><div className="k">Entries</div><div className="v">{doc.rows.length}</div></div>
        </div>

        <table className="st">
          <thead>
            <tr>
              <th style={{ width: 70 }}>Date</th>
              <th>Description</th>
              <th className="r" style={{ width: 80 }}>In ({doc.currency})</th>
              <th className="r" style={{ width: 80 }}>Out ({doc.currency})</th>
              <th className="r" style={{ width: 80 }}>Balance</th>
            </tr>
          </thead>
          <tbody>
            {doc.rows.map((r, i) => (
              <tr key={i}>
                <td>{r.date}</td>
                <td>
                  <div>{r.payee}</div>
                  <div className="st-cat">{r.category}{r.note ? ` — ${r.note}` : ""}</div>
                </td>
                <td className="r st-in">{r.in}</td>
                <td className="r st-out">{r.out}</td>
                <td className="r">{r.balance}</td>
              </tr>
            ))}
            {doc.rows.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: 30, color: "#999" }}>No entries</td></tr>
            )}
          </tbody>
        </table>

        <div className="st-foot">Generated by WellSpend — your money, finally clear.</div>
      </div>
    </div>
  );
}
