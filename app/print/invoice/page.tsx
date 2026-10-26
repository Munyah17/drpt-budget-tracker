"use client";

import { useSyncExternalStore } from "react";
import PrintDocument, { PRINT_DOC_KEY, PrintDocData } from "@/components/PrintDocument";

/** Shown when the page is opened directly with no stashed document */
const SAMPLE_DOC: PrintDocData = {
  kind: "QUOTATION",
  number: "QUO-000000-0000",
  date: new Date().toLocaleDateString("en-GB"),
  companyName: "Dr PT",
  companyLines: ["Harare, Zimbabwe", "+263 77 390 9307"],
  billToName: "Client Name",
  billToLines: ["client@email.com", "0773 000 000", "Client Address"],
  items: [
    { description: "Sample item", qty: 1, unitPrice: 0 },
  ],
  notes: ["Ecocash - 0773909307"],
  banking: ["FBC Bank — 6870465460146 (USD)"],
};

const emptySubscribe = () => () => {};

/** Memoized so getSnapshot returns a stable reference between renders */
let cached: { raw: string | null; doc: PrintDocData } | undefined;

function readDoc(): PrintDocData {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(PRINT_DOC_KEY);
  } catch {
    /* storage unavailable */
  }
  if (cached && cached.raw === raw) return cached.doc;
  let doc = SAMPLE_DOC;
  try {
    if (raw) doc = JSON.parse(raw) as PrintDocData;
  } catch {
    /* malformed payload — fall back to sample */
  }
  cached = { raw, doc };
  return doc;
}

export default function PrintInvoicePage() {
  const doc = useSyncExternalStore<PrintDocData>(emptySubscribe, readDoc, () => SAMPLE_DOC);

  return (
    <div className="print-screen">
      <style>{`
        @page { size: A4; margin: 0; }
        .print-screen {
          min-height: 100vh;
          background: #525659;
          padding: 24px 16px 48px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          box-sizing: border-box;
        }
        .print-toolbar { display: flex; gap: 10px; position: sticky; top: 12px; z-index: 10; }
        .print-toolbar button {
          border: none;
          border-radius: 8px;
          padding: 10px 22px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        }
        .pt-primary { background: #1E40AF; color: #fff; }
        .pt-primary:hover { background: #1D4ED8; }
        .pt-ghost { background: #fff; color: #141414; }
        .print-doc { box-shadow: 0 4px 24px rgba(0, 0, 0, 0.35); flex-shrink: 0; }
        @media print {
          .print-screen { background: #fff; padding: 0; }
          .print-toolbar { display: none; }
          .print-doc { box-shadow: none; }
        }
      `}</style>

      <div className="print-toolbar">
        <button className="pt-primary" onClick={() => window.print()}>
          Print / Save as PDF
        </button>
        <button className="pt-ghost" onClick={() => window.close()}>
          Close
        </button>
      </div>

      <PrintDocument doc={doc} />
    </div>
  );
}
